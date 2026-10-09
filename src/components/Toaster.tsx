"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastContextValue {
  show: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      counter.current += 1;
      const id = counter.current;
      setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`} role={item.tone === "error" ? "alert" : "status"}>
            <span className="toast-icon" aria-hidden="true">
              {item.tone === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <span className="toast-text">{item.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(item.id)} aria-label={t("common.close")}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
