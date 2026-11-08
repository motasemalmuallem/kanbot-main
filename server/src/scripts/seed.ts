/**
 * Replaces the local database with a ready-to-present Kanbot demo account.
 * Run from server/ with: npm run seed
 * Login: demo@kanbot.dev / password123
 */
import { randomUUID } from 'node:crypto';
import { db, type Data, type ProjectRecord, type SprintRecord, type TodoRecord } from '../db/store.js';
import { hashPassword } from '../lib/password.js';
import { addDays, today } from '../services/board.service.js';
import type { StoryPoints, TodoPriority, TodoStatus, TodoType } from '../types/api.js';

const iso = (date: string) => `${date}T09:00:00.000Z`;
const now = today();

const user = {
  id: randomUUID(),
  name: 'Demo Manager',
  email: 'demo@kanbot.dev',
  passwordHash: await hashPassword('password123'),
  createdAt: iso(addDays(now, -45)),
};

function makeProject(name: string, key: string, description: string, createdDaysAgo: number, nextSprintNumber: number): ProjectRecord {
  return {
    id: randomUUID(),
    userId: user.id,
    name,
    key,
    description,
    nextTodoNumber: 1,
    nextSprintNumber,
    createdAt: iso(addDays(now, -createdDaysAgo)),
    updatedAt: iso(now),
  };
}

const projects = [
  makeProject(
    'Kanbot Product',
    'KAN',
    'The Kanbot team workspace for product planning, delivery, and release readiness.',
    40,
    4,
  ),
  makeProject(
    'Habit Tracker',
    'HAB',
    'A mobile app that helps people build healthy habits and track steady progress.',
    25,
    2,
  ),
  makeProject(
    'Client Portal',
    'WEB',
    'A customer portal for project updates, shared files, and support requests.',
    32,
    3,
  ),
];

function makeSprint(
  project: ProjectRecord,
  name: string,
  status: SprintRecord['status'],
  goal: string,
  startOffset: number,
  endOffset: number,
  extra: Partial<SprintRecord> = {},
): SprintRecord {
  const startDate = addDays(now, startOffset);
  const endDate = addDays(now, endOffset);
  return {
    id: randomUUID(),
    projectId: project.id,
    name,
    goal,
    startDate,
    endDate,
    status,
    startedAt: status === 'active' || status === 'completed' ? iso(startDate) : null,
    completedAt: status === 'completed' ? iso(endDate) : null,
    completedStats: null,
    summary: null,
    createdAt: iso(addDays(now, Math.min(startOffset, -2))),
    updatedAt: iso(now),
    ...extra,
  };
}

const kanbot = projects[0]!;
const habits = projects[1]!;
const portal = projects[2]!;

const kanbotCompleted = makeSprint(
  kanbot,
  'Sprint 1 · Product foundation',
  'completed',
  'Set up the workspace and deliver the first usable planning flow.',
  -30,
  -17,
  {
    completedStats: {
      totalTodos: 5,
      doneTodos: 4,
      totalPoints: 16,
      donePoints: 13,
      byStatus: { todo: 0, in_progress: 0, in_review: 1, done: 4 },
      carriedOver: 1,
    },
    summary: {
      source: 'mock',
      generatedAt: iso(addDays(now, -17)),
      content: [
        '## Sprint 1 · Product foundation',
        '**Goal:** Set up the workspace and deliver the first usable planning flow.',
        '**Progress:** 4 of 5 tasks completed, delivering 13 of 16 points.',
        '### Highlights',
        '- Authentication and project setup are ready for the team.',
        '- The first backlog workflow is in place.',
        '### Carry-over',
        '- One review item moved forward for a final quality pass.',
        '### Next steps',
        '- Focus the next sprint on board interactions and reliable progress tracking.',
      ].join('\n\n'),
    },
  },
);

const kanbotActive = makeSprint(
  kanbot,
  'Sprint 2 · Board & backlog',
  'active',
  'Make day-to-day task planning clear, fast, and dependable.',
  -3,
  11,
);
const kanbotPlanned = makeSprint(
  kanbot,
  'Sprint 3 · Launch polish',
  'planned',
  'Polish the experience and prepare the next release.',
  12,
  25,
);

const habitsPlanned = makeSprint(
  habits,
  'Mobile MVP',
  'planned',
  'Ship a focused first version of daily habit tracking.',
  3,
  17,
);

const portalCompleted = makeSprint(
  portal,
  'Sprint 1 · Portal essentials',
  'completed',
  'Give clients one place to follow project updates and files.',
  -24,
  -10,
  {
    completedStats: {
      totalTodos: 4,
      doneTodos: 4,
      totalPoints: 13,
      donePoints: 13,
      byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 4 },
      carriedOver: 0,
    },
    summary: {
      source: 'mock',
      generatedAt: iso(addDays(now, -10)),
      content: [
        '## Sprint 1 · Portal essentials',
        '**Goal:** Give clients one place to follow project updates and files.',
        '**Progress:** All 4 tasks completed, delivering 13 of 13 points.',
        '### Highlights',
        '- The portal shell, project overview, and shared files are ready.',
        '- Client access and support entry points are in place.',
        '### Next steps',
        '- Gather feedback and prioritize the first round of improvements.',
      ].join('\n\n'),
    },
  },
);
const portalPlanned = makeSprint(
  portal,
  'Sprint 2 · Client feedback',
  'planned',
  'Improve the portal using early customer feedback.',
  5,
  19,
);

type SeedTodo = {
  title: string;
  type: TodoType;
  priority: TodoPriority;
  points: StoryPoints | null;
  status?: TodoStatus;
  assignee?: string | null;
  labels?: string[];
  description?: string;
};

const todos: TodoRecord[] = [];
const assignees = ['Sara Ahmed', 'Omar Ali', 'Lina Haddad', 'Yousef Khalil'];
const listOrders = new Map<string, number>();

function addTodos(project: ProjectRecord, sprint: SprintRecord | null, items: SeedTodo[]) {
  for (const item of items) {
    const status = item.status ?? 'todo';
    const listKey = `${sprint?.id ?? 'backlog'}:${sprint ? status : 'all'}`;
    const order = listOrders.get(listKey) ?? 0;
    listOrders.set(listKey, order + 1);
    const createdAt = iso(addDays(now, -Math.max(1, (todos.length % 19) + 1)));
    todos.push({
      id: randomUUID(),
      projectId: project.id,
      sprintId: sprint?.id ?? null,
      assigneeName: item.assignee === undefined ? assignees[todos.length % assignees.length]! : item.assignee,
      key: `${project.key}-${project.nextTodoNumber++}`,
      title: item.title,
      description: item.description ?? `Deliver ${item.title.toLowerCase()} with clear loading, empty, and error states.`,
      type: item.type,
      status,
      priority: item.priority,
      storyPoints: item.points,
      labels: item.labels ?? [],
      dueDate: null,
      order,
      createdAt,
      updatedAt: createdAt,
      completedAt: status === 'done' ? iso(addDays(now, -1)) : null,
    });
  }
}

// Kanbot Product: completed history, a live board with work in every column,
// a planned sprint, and a varied backlog for the main presentation.
addTodos(kanbot, kanbotCompleted, [
  { title: 'Set up authentication and protected routes', type: 'story', priority: 'high', points: 5, status: 'done', labels: ['auth', 'foundation'] },
  { title: 'Create the project workspace', type: 'story', priority: 'high', points: 3, status: 'done', labels: ['projects'] },
  { title: 'Build the first backlog view', type: 'story', priority: 'medium', points: 3, status: 'done', labels: ['backlog'] },
  { title: 'Add initial task editing', type: 'task', priority: 'medium', points: 2, status: 'done', labels: ['tasks'] },
  { title: 'Review onboarding copy', type: 'task', priority: 'low', points: 3, status: 'in_review', labels: ['polish'] },
]);
addTodos(kanbot, kanbotActive, [
  { title: 'Enable drag and drop across board columns', type: 'story', priority: 'high', points: 5, status: 'done', labels: ['board'] },
  { title: 'Update sprint progress immediately', type: 'task', priority: 'high', points: 3, status: 'done', assignee: 'Omar Ali', labels: ['board'] },
  { title: 'Improve task card hierarchy', type: 'story', priority: 'medium', points: 3, status: 'in_progress', assignee: 'Lina Haddad', labels: ['design'] },
  { title: 'Save sprint summaries for later', type: 'story', priority: 'high', points: 5, status: 'in_progress', labels: ['sprints', 'ai'] },
  { title: 'Add keyboard shortcuts for task editing', type: 'task', priority: 'medium', points: 2, status: 'in_review', assignee: 'Sara Ahmed', labels: ['accessibility'] },
  { title: 'Check board layout at tablet widths', type: 'task', priority: 'medium', points: 2, status: 'todo', labels: ['responsive'] },
  { title: 'Show helpful empty states', type: 'story', priority: 'low', points: 2, status: 'todo', labels: ['design'] },
]);
addTodos(kanbot, kanbotPlanned, [
  { title: 'Add project activity timeline', type: 'story', priority: 'medium', points: 5, labels: ['projects'] },
  { title: 'Prepare release checklist', type: 'task', priority: 'high', points: 3, labels: ['release'] },
]);
addTodos(kanbot, null, [
  { title: 'Add labels and quick filters', type: 'story', priority: 'medium', points: 5, labels: ['backlog'] },
  { title: 'Improve first-time project setup', type: 'story', priority: 'high', points: 5, labels: ['onboarding'] },
  { title: 'Add CSV export for sprint reports', type: 'task', priority: 'low', points: 3, labels: ['reports'] },
  { title: 'Handle expired sessions gracefully', type: 'bug', priority: 'urgent', points: 2, labels: ['auth'] },
  { title: 'Document keyboard navigation', type: 'task', priority: 'low', points: null, labels: ['docs'] },
]);

// Habit Tracker: planned MVP work plus additional backlog ideas.
addTodos(habits, habitsPlanned, [
  { title: 'Design the daily check-in flow', type: 'story', priority: 'high', points: 5, assignee: 'Sara Ahmed', labels: ['mobile', 'ux'] },
  { title: 'Build habit streak tracking', type: 'story', priority: 'high', points: 5, assignee: 'Omar Ali', labels: ['tracking'] },
  { title: 'Add reminder notifications', type: 'story', priority: 'medium', points: 3, assignee: 'Lina Haddad', labels: ['notifications'] },
  { title: 'Create weekly progress summary', type: 'task', priority: 'medium', points: 3, labels: ['insights'] },
]);
addTodos(habits, null, [
  { title: 'Add flexible habit schedules', type: 'story', priority: 'medium', points: 5, labels: ['planning'] },
  { title: 'Support a dark theme', type: 'task', priority: 'low', points: 3, labels: ['design'] },
  { title: 'Write the first-run tips', type: 'task', priority: 'low', points: 2, labels: ['onboarding'] },
  { title: 'Fix reminder time zone handling', type: 'bug', priority: 'urgent', points: 3, labels: ['notifications'] },
]);

// Client Portal: completed history, a planned improvement sprint, and backlog.
addTodos(portal, portalCompleted, [
  { title: 'Create the client project overview', type: 'story', priority: 'high', points: 5, status: 'done', labels: ['portal'] },
  { title: 'Add a secure shared files area', type: 'story', priority: 'high', points: 3, status: 'done', labels: ['files'] },
  { title: 'Show recent project updates', type: 'task', priority: 'medium', points: 3, status: 'done', labels: ['activity'] },
  { title: 'Add a support request entry point', type: 'task', priority: 'medium', points: 2, status: 'done', labels: ['support'] },
]);
addTodos(portal, portalPlanned, [
  { title: 'Allow clients to comment on updates', type: 'story', priority: 'high', points: 5, assignee: 'Omar Ali', labels: ['collaboration'] },
  { title: 'Add notification preferences', type: 'story', priority: 'medium', points: 3, labels: ['notifications'] },
  { title: 'Improve mobile portal navigation', type: 'task', priority: 'medium', points: 3, labels: ['responsive'] },
]);
addTodos(portal, null, [
  { title: 'Add project milestone view', type: 'story', priority: 'high', points: 5, labels: ['projects'] },
  { title: 'Support downloadable monthly reports', type: 'task', priority: 'medium', points: 3, labels: ['reports'] },
  { title: 'Add file search and filtering', type: 'story', priority: 'medium', points: 5, labels: ['files'] },
  { title: 'Clarify support request status', type: 'task', priority: 'low', points: 2, labels: ['support'] },
]);

const sprints = [kanbotCompleted, kanbotActive, kanbotPlanned, habitsPlanned, portalCompleted, portalPlanned];
const data: Data = { users: [user], projects, sprints, todos };

await db.initialize();
db.reset(data);
await db.flush();

const todosByProject = projects.map((project) => ({
  name: project.name,
  todos: todos.filter((todo) => todo.projectId === project.id).length,
}));
console.log('Replaced the database with the Kanbot demo account.');
console.log(`Created ${projects.length} projects, ${sprints.length} sprints, and ${todos.length} tasks.`);
for (const project of todosByProject) console.log(`- ${project.name}: ${project.todos} tasks`);
console.log('Login: demo@kanbot.dev / password123');
