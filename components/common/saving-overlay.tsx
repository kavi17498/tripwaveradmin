"use client";

import { Loader2 } from "lucide-react";

type SavingOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
};

export function SavingOverlay({
  open,
  title = "Saving trip...",
  description = "Please wait while we upload photos and create the trip.",
}: SavingOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 border border-border bg-card p-6 text-center shadow-2xl">
        <Loader2 className="size-10 animate-spin text-primary" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}