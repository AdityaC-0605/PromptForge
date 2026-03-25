'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState<Toast[]>([]);
  const queue = useRef<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setVisible((prev) => {
      const next = prev.filter((t) => t.id !== id);
      // Promote from queue if available
      if (queue.current.length > 0 && next.length < MAX_VISIBLE) {
        const [promoted, ...rest] = queue.current;
        queue.current = rest;
        scheduleAutoDismiss(promoted.id);
        return [...next, promoted];
      }
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleAutoDismiss = useCallback(
    (id: string) => {
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const toast: Toast = { id: crypto.randomUUID(), message, variant };

      setVisible((prev) => {
        if (prev.length < MAX_VISIBLE) {
          scheduleAutoDismiss(toast.id);
          return [...prev, toast];
        }
        queue.current = [...queue.current, toast];
        return prev;
      });
    },
    [scheduleAutoDismiss],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {visible.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Internal item — keeps dismiss wired without importing Toast circularly
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const variantColor: Record<ToastVariant, string> = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--blue)',
  };

  const icon: Record<ToastVariant, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const color = variantColor[toast.variant];

  return (
    <div
      role="status"
      onClick={() => onDismiss(toast.id)}
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        animation: 'slideIn 0.2s ease-out',
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
        {icon[toast.variant]}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  );
}
