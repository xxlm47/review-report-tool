import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Instant Quote Auditor | Fence Estimating Check',
  description: 'Catch fence estimating mistakes before sending a customer quote.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
