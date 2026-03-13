import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock posthog-js before importing analytics
const mockPosthog = {
  init: vi.fn(),
  identify: vi.fn(),
  capture: vi.fn(),
  reset: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
};

vi.mock('posthog-js', () => ({
  default: mockPosthog,
}));

// We need to test both enabled and disabled states.
// By default, VITE_POSTHOG_KEY is not set in test env, so all functions are no-ops.

describe('analytics (disabled — no POSTHOG_KEY)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initAnalytics is a no-op when disabled', async () => {
    const { initAnalytics } = await import('../analytics');
    await initAnalytics();
    expect(mockPosthog.init).not.toHaveBeenCalled();
  });

  it('identifyUser is a no-op when disabled', async () => {
    const { identifyUser } = await import('../analytics');
    await identifyUser('user-123', { plan: 'pro' });
    expect(mockPosthog.identify).not.toHaveBeenCalled();
  });

  it('trackEvent is a no-op when disabled', async () => {
    const { trackEvent } = await import('../analytics');
    trackEvent('page_view', { page: '/home' });
    // Fire-and-forget, but posthog should not be called
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('resetAnalytics is a no-op when disabled', async () => {
    const { resetAnalytics } = await import('../analytics');
    await resetAnalytics();
    expect(mockPosthog.reset).not.toHaveBeenCalled();
  });

  it('optInCapturing is a no-op when disabled', async () => {
    const { optInCapturing } = await import('../analytics');
    await optInCapturing();
    expect(mockPosthog.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('optOutCapturing is a no-op when disabled', async () => {
    const { optOutCapturing } = await import('../analytics');
    await optOutCapturing();
    expect(mockPosthog.opt_out_capturing).not.toHaveBeenCalled();
  });
});
