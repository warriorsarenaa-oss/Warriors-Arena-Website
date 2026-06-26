import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Book Your Game — Laser Tag & Gel Blasters | Warriors Arena Cairo',
  description:
    'Choose laser tag or gel blasters, pick a time slot, and book instantly. Real-time availability at Warriors Arena, Heliopolis, Cairo.',
  openGraph: {
    title: 'Book Laser Tag or Gel Blasters Now — Warriors Arena',
    description: 'Real-time availability. Safe gameplay. Book online instantly.',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://warriorsarenabookings.online',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Book a Game',
      item: 'https://warriorsarenabookings.online/book',
    },
  ],
};

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
