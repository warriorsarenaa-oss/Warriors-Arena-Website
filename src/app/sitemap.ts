import { MetadataRoute } from 'next';

const BASE = 'https://warriorsarenabookings.online';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/en`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/ar`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/en/book`,  lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/ar/book`,  lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/en/faq`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/ar/faq`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/en/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/ar/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
