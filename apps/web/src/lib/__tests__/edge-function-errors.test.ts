import { describe, it, expect } from 'vitest';
import { classifyEdgeFunctionError, isRetryableErrorType } from '../edge-function-errors';

describe('classifyEdgeFunctionError', () => {
  // Rate limited
  it('detects rate_limited from code', () => {
    expect(classifyEdgeFunctionError({ code: 'RATE_LIMITED' })).toBe('rate_limited');
  });

  it('detects rate_limited from status 429', () => {
    expect(classifyEdgeFunctionError({ status: 429 })).toBe('rate_limited');
  });

  it('detects rate_limited from message containing 429', () => {
    expect(classifyEdgeFunctionError({ message: 'Error 429 too many requests' })).toBe('rate_limited');
  });

  // Insufficient credits
  it('detects insufficient_credits from code', () => {
    expect(classifyEdgeFunctionError({ code: 'INSUFFICIENT_CREDITS' })).toBe('insufficient_credits');
  });

  it('detects insufficient_credits from PAYMENT_REQUIRED code', () => {
    expect(classifyEdgeFunctionError({ code: 'PAYMENT_REQUIRED' })).toBe('insufficient_credits');
  });

  it('detects insufficient_credits from status 402', () => {
    expect(classifyEdgeFunctionError({ status: 402 })).toBe('insufficient_credits');
  });

  it('detects insufficient_credits from message containing 402', () => {
    expect(classifyEdgeFunctionError({ message: 'Error 402 payment required' })).toBe('insufficient_credits');
  });

  // Resource limit
  it('detects resource_limit from status 546', () => {
    expect(classifyEdgeFunctionError({ status: 546 })).toBe('resource_limit');
  });

  it('detects resource_limit from message containing 546', () => {
    expect(classifyEdgeFunctionError({ message: 'Error 546 worker limit' })).toBe('resource_limit');
  });

  it('detects resource_limit from compute resources message', () => {
    expect(classifyEdgeFunctionError({ message: 'Insufficient compute resources' })).toBe('resource_limit');
  });

  // No data
  it('detects no_data from Portuguese message', () => {
    expect(classifyEdgeFunctionError({ message: 'Endpoint não retornou dados' })).toBe('no_data');
  });

  it('detects no_data from English message', () => {
    expect(classifyEdgeFunctionError({ message: 'No data returned' })).toBe('no_data');
  });

  // Connection errors via Supabase class names
  it('detects connection from FunctionsFetchError name', () => {
    expect(classifyEdgeFunctionError({ name: 'FunctionsFetchError' })).toBe('connection');
  });

  it('detects connection from functionsfetcherror message', () => {
    expect(classifyEdgeFunctionError({ message: 'FunctionsFetchError: timeout' })).toBe('connection');
  });

  // Server errors via Supabase class names
  it('detects server from FunctionsHttpError name', () => {
    expect(classifyEdgeFunctionError({ name: 'FunctionsHttpError' })).toBe('server');
  });

  it('detects server from functionshttperror message', () => {
    expect(classifyEdgeFunctionError({ message: 'FunctionsHttpError occurred' })).toBe('server');
  });

  it('detects server from FunctionsRelayError name', () => {
    expect(classifyEdgeFunctionError({ name: 'FunctionsRelayError' })).toBe('server');
  });

  it('detects server from functionsrelayerror message', () => {
    expect(classifyEdgeFunctionError({ message: 'FunctionsRelayError happened' })).toBe('server');
  });

  // Connection errors via common messages
  it('detects connection from "failed to fetch"', () => {
    expect(classifyEdgeFunctionError({ message: 'Failed to fetch' })).toBe('connection');
  });

  it('detects connection from "failed to send a request"', () => {
    expect(classifyEdgeFunctionError({ message: 'Failed to send a request' })).toBe('connection');
  });

  it('detects connection from "timeout"', () => {
    expect(classifyEdgeFunctionError({ message: 'Request timeout' })).toBe('connection');
  });

  it('detects connection from "networkerror"', () => {
    expect(classifyEdgeFunctionError({ message: 'NetworkError' })).toBe('connection');
  });

  it('detects connection from "network" keyword', () => {
    expect(classifyEdgeFunctionError({ message: 'Network failure' })).toBe('connection');
  });

  it('detects connection from "econnrefused"', () => {
    expect(classifyEdgeFunctionError({ message: 'ECONNREFUSED' })).toBe('connection');
  });

  it('detects connection from "econnreset"', () => {
    expect(classifyEdgeFunctionError({ message: 'ECONNRESET' })).toBe('connection');
  });

  it('detects connection from "aborted"', () => {
    expect(classifyEdgeFunctionError({ message: 'Request aborted' })).toBe('connection');
  });

  // Server errors via HTTP status codes in message
  it('detects server from 500 message', () => {
    expect(classifyEdgeFunctionError({ message: 'Internal Server Error 500' })).toBe('server');
  });

  it('detects server from 502 message', () => {
    expect(classifyEdgeFunctionError({ message: 'Bad Gateway 502' })).toBe('server');
  });

  it('detects server from 503 message', () => {
    expect(classifyEdgeFunctionError({ message: 'Service Unavailable 503' })).toBe('server');
  });

  it('detects connection from 504/timeout message (timeout takes priority)', () => {
    expect(classifyEdgeFunctionError({ message: 'Gateway Timeout 504' })).toBe('connection');
  });

  it('detects server from 504 message without timeout keyword', () => {
    expect(classifyEdgeFunctionError({ message: 'Error code 504' })).toBe('server');
  });

  it('detects server from "edge function" message', () => {
    expect(classifyEdgeFunctionError({ message: 'Edge function failed' })).toBe('server');
  });

  // Unknown
  it('returns unknown for unrecognized errors', () => {
    expect(classifyEdgeFunctionError({ message: 'Something happened' })).toBe('unknown');
  });

  it('handles empty error object', () => {
    expect(classifyEdgeFunctionError({})).toBe('unknown');
  });

  it('handles error with no properties', () => {
    expect(classifyEdgeFunctionError(new Error())).toBe('unknown');
  });

  it('handles TypeError with fetch message', () => {
    const err = new TypeError('Failed to fetch');
    expect(classifyEdgeFunctionError(err)).toBe('connection');
  });
});

describe('isRetryableErrorType', () => {
  it('returns true for rate_limited', () => {
    expect(isRetryableErrorType('rate_limited')).toBe(true);
  });

  it('returns true for connection', () => {
    expect(isRetryableErrorType('connection')).toBe(true);
  });

  it('returns true for server', () => {
    expect(isRetryableErrorType('server')).toBe(true);
  });

  it('returns true for resource_limit', () => {
    expect(isRetryableErrorType('resource_limit')).toBe(true);
  });

  it('returns false for insufficient_credits', () => {
    expect(isRetryableErrorType('insufficient_credits')).toBe(false);
  });

  it('returns false for no_data', () => {
    expect(isRetryableErrorType('no_data')).toBe(false);
  });

  it('returns false for unknown', () => {
    expect(isRetryableErrorType('unknown')).toBe(false);
  });
});
