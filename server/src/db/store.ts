import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { env } from '../config/env.js';
import type {
  SprintStats,
  SprintStatus,
  SprintSummary,
  StoryPoints,
  TodoPriority,
  TodoStatus,
  TodoType,
} from '../types/api.js';

// ── Records (internal shapes — convert with serializers before sending) ──

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  key: string;
  description: string;
  /** Next number for todo keys (KAN-<n>). */
  nextTodoNumber: number;
  /** Next number for default sprint names (Sprint <n>). */
  nextSprintNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface SprintRecord {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string | null;
  endDate: string | null;
  status: SprintStatus;
  startedAt: string | null;
  completedAt: string | null;
  /** Snapshot taken when the sprint is completed. */
  completedStats: (SprintStats & { carriedOver: number }) | null;
  summary: SprintSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoRecord {
  id: string;
  projectId: string;
  sprintId: string | null;
  assigneeName: string | null;
  key: string;
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
  labels: string[];
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Data {
  users: UserRecord[];
  projects: ProjectRecord[];
  sprints: SprintRecord[];
  todos: TodoRecord[];
}

const empty = (): Data => ({ users: [], projects: [], sprints: [], todos: [] });

/**
 * A small in-memory data store backed by JSON on a developer machine or one
 * JSONB row in PostgreSQL in production. Mutations are serialized and flushed
 * asynchronously so the existing synchronous service layer can stay intact.
 */
class JsonStore {
  private readonly file = resolve(env.DATA_FILE);
  private readonly postgres = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;
  private flushing: Promise<void> = Promise.resolve();
  private flushError: unknown = null;
  private dirty = false;
  data: Data = empty();

  constructor() {
    if (!this.postgres) {
      mkdirSync(dirname(this.file), { recursive: true });
      this.data = existsSync(this.file) ? { ...empty(), ...JSON.parse(readFileSync(this.file, 'utf8')) } : empty();
    }
  }

  /** Load persistent PostgreSQL data before accepting API requests. */
  async initialize(): Promise<void> {
    if (!this.postgres) return;

    await this.postgres`CREATE TABLE IF NOT EXISTS kanbot_store (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      payload JSONB NOT NULL
    )`;
    await this.postgres`INSERT INTO kanbot_store (id, payload)
      VALUES (1, ${JSON.stringify(empty())}::jsonb)
      ON CONFLICT (id) DO NOTHING`;

    const rows = await this.postgres`SELECT payload FROM kanbot_store WHERE id = 1`;
    const payload = (rows[0] as { payload?: Data } | undefined)?.payload;
    if (payload) this.data = { ...empty(), ...payload };
  }

  /** Mutate data, then persist. Returns whatever the mutator returns. */
  write<T>(mutate: (data: Data) => T): T {
    const result = mutate(this.data);
    this.scheduleFlush();
    return result;
  }

  /** Replace everything (used by the seed script). */
  reset(data: Data = empty()) {
    this.data = data;
    this.scheduleFlush();
  }

  /** Resolves once everything written so far is persisted. */
  async flush(): Promise<void> {
    await this.flushing;
    if (this.flushError) throw this.flushError;
  }

  private scheduleFlush() {
    if (this.dirty) return;
    this.dirty = true;
    this.flushError = null;
    this.flushing = this.flushing
      .catch(() => undefined)
      .then(async () => {
        this.dirty = false;
        if (this.postgres) {
          await this.postgres`INSERT INTO kanbot_store (id, payload)
            VALUES (1, ${JSON.stringify(this.data)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`;
          return;
        }

        const tmp = `${this.file}.tmp`;
        await writeFile(tmp, JSON.stringify(this.data, null, 2));
        await rename(tmp, this.file);
      })
      .catch((error: unknown) => {
        this.flushError = error;
        console.error('Kanbot could not persist the latest changes.');
      });
  }
}

export const db = new JsonStore();
