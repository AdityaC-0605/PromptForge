// src/components/AppShell.tsx — Persistent layout: sidebar left, scrollable content right
import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
