import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Reputation Manager',
  description: 'Turn customer reviews into an actionable local-business reputation report.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
