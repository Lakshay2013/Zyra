import OpenAI from 'openai';

// ── Error Classes ──

export class ZyraError extends Error {
  type: string;
  status: number;
  details: unknown;
  constructor(message?: string, type?: string, status?: number, details?: unknown);
}

export class ZyraTimeoutError extends ZyraError {
  constructor(message?: string, details?: unknown);
}

export class ZyraRoutingError extends ZyraError {
  constructor(message?: string, details?: unknown);
}

export class ProviderError extends ZyraError {
  provider: string;
  constructor(message?: string, provider?: string, status?: number, details?: unknown);
}

export class ZyraFirewallError extends ZyraError {
  constructor(message?: string, details?: unknown);
}

export class ZyraRateLimitError extends ZyraError {
  constructor(message?: string, details?: unknown);
}

// ── Routing Config ──

export interface ZyraRouting {
  maxCost?: number;
  providers?: string[];
  mode?: 'auto' | 'constrained' | 'strict';
}

export interface ZyraOptions {
  apiKey: string;
  baseURL?: string;
  debug?: boolean;
  routing?: ZyraRouting;
  defaultHeaders?: Record<string, string>;
}

// ── Main Client ──
// Extends the OpenAI client, so `client.chat.completions.create(...)`,
// streaming, and all OpenAI-compatible params work unchanged.

export class Zyra extends OpenAI {
  constructor(options: ZyraOptions);
}

export default Zyra;
