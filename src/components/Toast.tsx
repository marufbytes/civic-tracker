'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';
type ToastItem = { id: number; type: ToastType; message: string };

const ToastContext = createContext<(type: ToastType, message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="ml-2 opacity-80 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

