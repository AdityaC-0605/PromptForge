import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromptDiff from '@/src/components/PromptDiff';

describe('PromptDiff', () => {
  it('renders added lines with diff-added class', () => {
    const { container } = render(<PromptDiff oldPrompt="" newPrompt="Added line" />);
    const addedElement = container.querySelector('.diff-added');
    expect(addedElement).toBeInTheDocument();
    expect(addedElement?.textContent).toContain('Added line');
  });

  it('renders removed lines with diff-removed class', () => {
    const { container } = render(<PromptDiff oldPrompt="Removed line" newPrompt="" />);
    const removedElement = container.querySelector('.diff-removed');
    expect(removedElement).toBeInTheDocument();
    expect(removedElement?.textContent).toContain('Removed line');
  });

  it('renders unchanged lines with diff-unchanged class', () => {
    const { container } = render(<PromptDiff oldPrompt="Same line" newPrompt="Same line" />);
    const unchangedElement = container.querySelector('.diff-unchanged');
    expect(unchangedElement).toBeInTheDocument();
    expect(unchangedElement?.textContent).toContain('Same line');
  });

  it('renders empty-state message when both prompts are empty', () => {
    render(<PromptDiff oldPrompt="" newPrompt="" />);
    expect(screen.getByText('No diff available.')).toBeInTheDocument();
  });

  it('renders line numbers when showLineNumbers is true', () => {
    const { container } = render(
      <PromptDiff oldPrompt="line one" newPrompt="line one" showLineNumbers={true} />
    );
    // Line number spans should be present
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('does not render line number spans when showLineNumbers is false', () => {
    const { container } = render(
      <PromptDiff oldPrompt="hello" newPrompt="world" showLineNumbers={false} />
    );
    // Each row should only have one child span (the text), not two
    const rows = container.querySelectorAll('.diff-added, .diff-removed, .diff-unchanged');
    rows.forEach((row) => {
      expect(row.querySelectorAll('span').length).toBe(1);
    });
  });

  it('correctly classifies a multi-line diff', () => {
    const { container } = render(
      <PromptDiff oldPrompt={'line1\nline2'} newPrompt={'line1\nline3'} />
    );
    expect(container.querySelector('.diff-unchanged')).toBeInTheDocument();
    expect(container.querySelector('.diff-removed')).toBeInTheDocument();
    expect(container.querySelector('.diff-added')).toBeInTheDocument();
  });
});
