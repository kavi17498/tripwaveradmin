import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  meta?: string;
  icon?: ReactNode;
}

export function SummaryCard({ title, value, meta, icon }: SummaryCardProps) {
  return (
    <article className="border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
    </article>
  );
}
