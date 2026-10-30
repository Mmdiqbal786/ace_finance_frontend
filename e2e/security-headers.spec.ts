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
    expect(headers['x-frame-options']?.toUpperCase()).toBe('DENY');
    expect(headers['content-security-policy'] || '').toMatch(/default-src/i);
    expect(headers['content-security-policy'] || '').toMatch(/frame-ancestors/i);
  });
});
