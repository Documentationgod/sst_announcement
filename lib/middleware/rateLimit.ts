import { NextRequest } from 'next/server';
import { ForbiddenError } from '../utils/errors';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

interface RateLimitState {
  count: number;
  expiresAt: number;
}

const limiterStore = new Map<string, RateLimitState>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return (request as any).ip || 'unknown';
}

export async function applyRateLimit(request: NextRequest, options: RateLimitOptions): Promise<void> {
  const ip = getClientIp(request);
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const existing = limiterStore.get(key);

  if (!existing || existing.expiresAt < now) {
    limiterStore.set(key, { count: 1, expiresAt: now + options.windowMs });
    return;
  }

  if (existing.count >= options.max) {
    throw new ForbiddenError('Too many requests, please try again later.');
  }

  existing.count += 1;
  limiterStore.set(key, existing);
}

export const generalLimiterOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'general',
};

export const authLimiterOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: 'auth',
};

export const adminLimiterOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyPrefix: 'admin',
};

export const strictLimiterOptions: RateLimitOptions = {
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: 'strict',
};
