import OpenAI from 'openai';

// ── Error Classes ──

export class ZyraError extends Error {
  type: string;
  status: number;
  details: any;
  constructor(message?: string, type?: string, status?: number, details?: any);
}

export class ZyraTimeoutError extends ZyraError {
  constructor(message?: string, details?: any);
}

export class ZyraRoutingError extends ZyraError {
  constructor(message?: string, details?: any);
}

export class ProviderError extends ZyraError {
  provider: string;
  constructor(message?: string, provider?: string, status?: number, details?: any);
}

export class ZyraFirewallError extends ZyraError {
  constructor(message?: string, details?: any);
}

export class ZyraRateLimitError extends ZyraError {
  constructor(message?: string, details?: any);
}

// ── Routing Config ──

export interface ZyraRouting {
  maxCost?: number;
  providers?: string[];
  mode?: 'auto' | 'constrained' | 'strict';
}

// ── Zyra Options ──

export interface ZyraOptions {
  apiKey: string;
  baseURL?: string;
  debug?: boolean;
  routing?: ZyraRouting;
  defaultHeaders?: Record<string, string>;
}

// ── Debug Info ──

export interface ZyraDebugInfo {
  model: string;
  provider: string;
  cost: number;
  savings: number;
  complexity: string;
  cached: boolean;
  fallback?: string;
  qualityRetry?: boolean;
}

// ── Middleware ──

export type ZyraMiddleware = (req: any, next: (req: any) => Promise<any>) => Promise<any>;

// ── Main Client ──

export class Zyra extends OpenAI {
  constructor(options: ZyraOptions);
  use(fn: ZyraMiddleware): this;
  get debug(): ZyraDebugInfo | null;
}

// ── Legacy ──

export class AIShield {
  constructor(options: { apiKey: string; baseUrl?: string });
  log(data: { userId: string; model: string; prompt: string; response?: string; tokens?: any; latency?: number }): Promise<void>;
  shutdown(): Promise<void>;
}

export class OpenAIShield {
  constructor(openaiClient: any, shield: AIShield);
  chat: {
    completions: {
      create(params: any, options?: { userId?: string }): Promise<any>;
    };
  };
}
