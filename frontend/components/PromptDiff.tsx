"use client";

interface PromptDiffProps {
  diff: string;
  oldVersion?: number;
  newVersion?: number;
}

export default function PromptDiff({ diff, oldVersion, newVersion }: PromptDiffProps) {
  if (!diff) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Prompt Diff</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No diff available for the first version.</p>
      </div>
    );
  }

  const lines = diff.split("\n");

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Prompt Diff
        </h3>
        {oldVersion !== undefined && newVersion !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            <span className="badge badge-danger">v{oldVersion}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span className="badge badge-success">v{newVersion}</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg" style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        maxHeight: '400px',
        overflowY: 'auto',
      }}>
        {lines.map((line, i) => {
          let className = "diff-unchanged";
          if (line.startsWith("+ ")) className = "diff-added";
          else if (line.startsWith("- ")) className = "diff-removed";

          return (
            <div key={i} className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
