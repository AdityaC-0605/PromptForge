// app/(app)/layout.tsx — AppShell wrapper for all dashboard routes
import AppShell from '../../src/components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
