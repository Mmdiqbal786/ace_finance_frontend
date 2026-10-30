import { test, expect } from '@playwright/test';

/**
 * @vapt A02 — Static Web App document security headers
 */
test.describe('VAPT A02 security headers @vapt', () => {
  test('home document sends CSP / frame / nosniff headers', async ({
    request,
  }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();
    expect(headers['x-content-type-options']?.toLowerCase()).toBe('nosniff');
    // SWA config sets DENY; some Azure edges may emit SAMEORIGIN — both block cross-origin framing.
    // Stronger control is CSP frame-ancestors 'none'.
    expect(['DENY', 'SAMEORIGIN']).toContain(
      (headers['x-frame-options'] || '').toUpperCase(),
    );
    expect(headers['content-security-policy'] || '').toMatch(/default-src/i);
    expect(headers['content-security-policy'] || '').toMatch(/frame-ancestors/i);
  });
});
