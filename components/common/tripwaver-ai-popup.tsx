"use client";

import React from "react";

type TripwaverAIPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TripwaverAIPopup({ isOpen, onClose }: TripwaverAIPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">TripWaver AI</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close TripWaver AI popup"
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-lg"
          >
            ×
          </button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          TripWaver AI suggestions will appear here.
        </div>
      </div>
    </div>
  );
}
