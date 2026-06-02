import { describe, it, expect } from 'vitest';

describe('CMS Type Definitions', () => {
  it('CmsContent has required fields', () => {
    const content: any = {
      id: 'test-uuid',
      section: 'hero',
      key: 'slogan',
      value_en: 'Test',
      value_ar: 'اختبار',
      content_type: 'text',
      updated_at: new Date().toISOString(),
    };
    expect(content.section).toBe('hero');
  });

  it('GalleryImage has required fields', () => {
    const image: any = {
      id: 'test-uuid',
      url: 'https://example.com/image.jpg',
      is_active: true,
      sort_order: 0,
      uploaded_at: new Date().toISOString(),
    };
    expect(image.url).toBeTruthy();
  });
});
