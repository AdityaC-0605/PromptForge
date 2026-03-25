import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ScoreRing from '@/src/components/ScoreRing';

describe('ScoreRing', () => {
  it('renders percentage text correctly', () => {
    const { container } = render(<ScoreRing score={75} />);
    const textNode = container.querySelector('text');
    expect(textNode?.textContent).toBe('75%');
  });

  it('uses red color when score < 60', () => {
    const { container } = render(<ScoreRing score={50} />);
    const circles = container.querySelectorAll('circle');
    const arc = Array.from(circles).find(c => c.getAttribute('stroke-dashoffset') !== null);
    expect(arc?.getAttribute('stroke')).toBe('#dc2626');
  });

  it('uses amber color when 60 ≤ score < 85', () => {
    const { container } = render(<ScoreRing score={72} />);
    const circles = container.querySelectorAll('circle');
    const arc = Array.from(circles).find(c => c.getAttribute('stroke-dashoffset') !== null);
    expect(arc?.getAttribute('stroke')).toBe('#d97706');
  });

  it('uses green color when score ≥ 85', () => {
    const { container } = render(<ScoreRing score={90} />);
    const circles = container.querySelectorAll('circle');
    const arc = Array.from(circles).find(c => c.getAttribute('stroke-dashoffset') !== null);
    expect(arc?.getAttribute('stroke')).toBe('#16a34a');
  });

  it('renders tick mark line element', () => {
    const { container } = render(<ScoreRing score={80} target={95} />);
    const line = container.querySelector('line');
    expect(line).toBeTruthy();
  });

  it('uses mono font for score text', () => {
    const { container } = render(<ScoreRing score={80} />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('font-family')).toContain('monospace');
  });
});
