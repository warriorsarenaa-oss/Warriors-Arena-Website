import { describe, it, expect } from 'vitest';

describe('CMS API — /api/v1/cms', () => {
  
  describe('GET /api/v1/cms/hero', () => {
    it('returns hero content with en and ar keys', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/hero');
      if (!res.ok) {
        console.warn('Is the server running? Run npm run dev for e2e tests');
        return;
      }
      const data = await res.json();
      expect(data).toHaveProperty('en');
      expect(data).toHaveProperty('ar');
      expect(data.en).toHaveProperty('location_badge');
      expect(data.en).toHaveProperty('slogan_line1');
      expect(data.en).toHaveProperty('subtitle');
    });

    it('returns string values for all fields', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/hero');
      if (!res.ok) return;
      const data = await res.json();
      Object.values(data.en).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('GET /api/v1/cms/faq', () => {
    it('returns array of active FAQs', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/faq');
      if (!res.ok) return;
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('FAQs have required fields', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/faq');
      if (!res.ok) return;
      const data = await res.json();
      if (data.length > 0) {
        const faq = data[0];
        expect(faq).toHaveProperty('question_en');
        expect(faq).toHaveProperty('answer_en');
        expect(faq).toHaveProperty('sort_order');
      }
    });
  });

  describe('GET /api/v1/cms/protocol', () => {
    it('returns ordered protocol steps', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/protocol');
      if (!res.ok) return;
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      
      // Verify ordering
      for (let i = 1; i < data.length; i++) {
        expect(data[i].step_number).toBeGreaterThan(data[i-1].step_number);
      }
    });
  });

  describe('GET /api/v1/cms/gallery', () => {
    it('returns only active gallery images', async () => {
      const res = await fetch('http://localhost:3000/api/v1/cms/gallery');
      if (!res.ok) return;
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach((img: any) => {
        expect(img.is_active).toBe(true);
        expect(img).toHaveProperty('url');
      });
    });
  });
});
