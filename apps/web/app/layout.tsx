import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Passmint',
  description: 'QR ticketing for events and gate verification.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
