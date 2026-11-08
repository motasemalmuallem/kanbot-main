import { env } from '../config/env.js';
import { aiError } from '../lib/errors.js';
import Groq, { APIConnectionError, APIConnectionTimeoutError, APIError } from 'groq-sdk';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let groqClient: Groq | undefined;

function isGroqProvider(): boolean {
  return env.AI_BASE_URL.includes('api.groq.com');
}

function getGroqClient(): Groq {
  if (!groqClient) {
    // The SDK adds /openai/v1 itself, so strip it from AI_BASE_URL before passing baseURL.
    const baseURL = env.AI_BASE_URL.replace(/\/openai\/v1\/?$/i, '');
    groqClient = new Groq({
      apiKey: env.AI_API_KEY,
      baseURL,
      timeout: env.AI_TIMEOUT_MS,
      maxRetries: 0,
    });
  }
  return groqClient;
}

function getGroqErrorDetails(error: APIError): { code?: string; message?: string } {
  const body = error.error as { error?: { code?: unknown; message?: unknown } } | undefined;
  return {
    code: typeof body?.error?.code === 'string' ? body.error.code : undefined,
    message: typeof body?.error?.message === 'string' ? body.error.message : undefined,
  };
}

async function completeWithGroq(messages: LlmMessage[], opts: { maxTokens?: number; temperature?: number }): Promise<string> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: env.AI_MODEL,
      messages,
      max_completion_tokens: opts.maxTokens ?? 1500,
      temperature: opts.temperature ?? 0.4,
    });
    const content = completion.choices[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    throw aiError('The AI returned an empty answer. Try again.');
  } catch (error) {
    if (error instanceof APIError) {
      const details = getGroqErrorDetails(error);
      console.error(`Groq provider error ${error.status}${details.code ? ` (${details.code})` : ''}: ${details.message ?? error.message}`);
      if (error.status === 401) throw aiError('Groq rejected the API key (check AI_API_KEY).');
      if (error.status === 403) {
        if (details.code === 'model_permission_blocked_org' || details.code === 'model_permission_blocked_project') {
          throw aiError(details.message ?? `The AI model ${env.AI_MODEL} is blocked by Groq permissions.`);
        }
        throw aiError(details.message ?? `Groq denied access to ${env.AI_MODEL}. Check the API key's project and model permissions.`);
      }
      if (error.status === 429) throw aiError('The Groq rate limit was reached. Wait a moment and try again.');
      throw aiError(details.message ?? `Groq returned an error (${error.status ?? 'unknown'}).`);
    }
    if (error instanceof APIConnectionTimeoutError) throw aiError('The AI took too long to answer. Try again.');
    if (error instanceof APIConnectionError) throw aiError('Could not reach the AI provider.');
    if (error instanceof Error && error.name === 'TimeoutError') throw aiError('The AI took too long to answer. Try again.');
    throw error;
  }
}

/**
 * One non-streaming call to any OpenAI-compatible Chat Completions API
 * (OpenRouter, Groq, Gemini's OpenAI endpoint, Ollama, OpenAI...).
 */
export async function complete(messages: LlmMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  if (isGroqProvider()) return completeWithGroq(messages, opts);

  let res: Response;
  try {
    res = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Kanbot', // OpenRouter app attribution; ignored elsewhere
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 1500,
        temperature: opts.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    throw aiError(timedOut ? 'The AI took too long to answer. Try again.' : 'Could not reach the AI provider.');
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`AI provider error ${res.status}: ${text.slice(0, 500)}`);
    let providerCode: string | undefined;
    try {
      const providerError = JSON.parse(text) as { error?: { code?: unknown } };
      if (typeof providerError.error?.code === 'string') providerCode = providerError.error.code;
    } catch {
      // Keep the status-based message when the provider response is not JSON.
    }
    if (res.status === 401) throw aiError('The AI provider rejected the API key (check AI_API_KEY).');
    if (res.status === 403) {
      if (providerCode === 'model_permission_blocked_org' || providerCode === 'model_permission_blocked_project') {
        throw aiError(`The AI model ${env.AI_MODEL} is blocked by Groq permissions. Enable it for your organization or project, or choose an allowed model.`);
      }
      throw aiError(`The AI provider denied access to this request (403). Check the model and account permissions for ${env.AI_MODEL}.`);
    }
    if (res.status === 429) throw aiError('The AI provider rate limit was reached. Wait a moment and try again.');
    throw aiError(`The AI provider returned an error (${res.status}).`);
  }
  try {
    const json = JSON.parse(text) as { choices?: { message?: { content?: string | null } }[] };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (content) return content;
  } catch {
    // fall through
  }
  throw aiError('The AI returned an empty answer. Try again.');
}

/** Pulls the first JSON object out of a reply (models love wrapping JSON in ```fences``` or prose). */
export function extractJson(reply: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(reply)?.[1];
  const candidate = fenced ?? reply;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) throw aiError('The AI answer was not in the expected format. Try again.');
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw aiError('The AI answer was not in the expected format. Try again.');
  }
}
