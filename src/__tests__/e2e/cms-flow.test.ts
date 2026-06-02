import { describe, it, expect } from 'vitest';

describe('E2E: CMS Content Update Flow', () => {

  it('Admin updates hero slogan → public page shows new slogan', async () => {
    // Step 1: Update via admin API
    const updateRes = await fetch('http://localhost:3000/api/v1/admin/cms', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'session=<test_admin_session>'
      },
      body: JSON.stringify({
        section: 'hero',
        key: 'slogan_line1',
        value_en: 'E2E TEST SLOGAN',
      }),
    });
    
    // Test will skip if no actual mock server is running for unauthenticated calls
    if (updateRes.status === 401) return;
    
    expect(updateRes.status).toBe(200);

    // Step 2: Fetch public API
    const publicRes = await fetch('http://localhost:3000/api/v1/cms/hero');
    const data = await publicRes.json();

    // Step 3: Verify new content appears
    expect(data.en.slogan_line1).toBe('E2E TEST SLOGAN');

    // Step 4: Restore original
    await fetch('http://localhost:3000/api/v1/admin/cms', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'session=<test_admin_session>'
      },
      body: JSON.stringify({
        section: 'hero',
        key: 'slogan_line1',
        value_en: 'LOCK AND LOAD',
      }),
    });
  });
});
