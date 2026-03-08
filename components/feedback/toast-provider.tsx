"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      pushToast: (toast: Omit<ToastItem, "id">) => {
        const id = Date.now();
        setItems((prev) => [...prev, { ...toast, id }]);
        setTimeout(() => {
          setItems((prev) => prev.filter((item) => item.id !== id));
        }, 3500);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="border border-border bg-background p-3 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? <p className="mt-1 text-xs text-muted-foreground">{item.description}</p> : null}
              </div>
              <button
                type="button"
                className="text-muted-foreground"
                onClick={() => setItems((prev) => prev.filter((toast) => toast.id !== item.id))}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
