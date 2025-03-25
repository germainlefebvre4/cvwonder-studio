'use client';

import { usePathname } from 'next/navigation';

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSessionPage = pathname?.includes('/session/');

  return (
    <div className={isSessionPage ? 'session-page' : ''}>
      {children}
    </div>
  );
}