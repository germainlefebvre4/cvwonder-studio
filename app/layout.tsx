import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionWrapper from './components/session-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CV Wonder Studio',
  description: 'Generate you CV with Wonder!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SessionWrapper>
        <body className={inter.className}>{children}</body>
      </SessionWrapper>
    </html>
  );
}
