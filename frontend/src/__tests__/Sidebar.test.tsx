import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/src/components/Sidebar';
import { usePathname } from 'next/navigation';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('Sidebar', () => {
  it('renders all four nav links', () => {
    (usePathname as any).mockReturnValue('/dashboard');
    render(<Sidebar />);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('New run')[0]).toBeInTheDocument();
    expect(screen.getAllByText('History')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tasks')[0]).toBeInTheDocument();
  });

  it('marks active link for current route', () => {
    (usePathname as any).mockReturnValue('/history');
    render(<Sidebar />);
    const activeLink = screen.getAllByText('History')[0].closest('a');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
    expect(activeLink?.style.color).toBe('var(--text)');

    const inactiveLink = screen.getAllByText('Dashboard')[0].closest('a');
    expect(inactiveLink?.getAttribute('aria-current')).toBeNull();
  });
});
