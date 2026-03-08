"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  children?: ReactNode;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg border border-border bg-background p-5 shadow-lg">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onConfirm ? <Button onClick={onConfirm}>{confirmText}</Button> : null}
        </div>
      </div>
    </div>
  );
}
