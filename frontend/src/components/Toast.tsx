'use client';

import type { ToastVariant } from './ToastProvider';

interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  onDismiss: (id: string) => void;
}

const variantColor: Record<ToastVariant, string> = {
  success: 'var(--green)',
  error: 'var(--red)',
  info: 'var(--blue)',
};

const variantIcon: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function Toast({ id, message, variant, onDismiss }: ToastProps) {
  const color = variantColor[variant];

  return (
    <div
      role="status"
      onClick={() => onDismiss(id)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${color}`,
        background: 'var(--bg-card)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem',
        fontWeight: 400,
        maxWidth: '20rem',
        minWidth: '14rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color,
          fontWeight: 500,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {variantIcon[variant]}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}
