import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusClassMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "in review": "bg-sky-50 text-sky-700 border-sky-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  requested: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-indigo-50 text-indigo-700 border-indigo-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        statusClassMap[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200",
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
