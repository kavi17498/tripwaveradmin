import { Bell, BadgeCheck, Clock3, CreditCard } from "lucide-react";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap = {
  "trip-approved": BadgeCheck,
  "join-request": BadgeCheck,
  payment: CreditCard,
  reminder: Clock3,
  "account-alert": Bell,
};

interface NotificationItemProps {
  item: Notification;
  onClick?: (item: Notification) => void | Promise<void>;
}

export function NotificationItem({ item, onClick }: NotificationItemProps) {
  const Icon = iconMap[item.type] ?? Bell;
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={cn(
        "flex w-full items-start gap-3 border border-border p-4 text-left transition-colors",
        item.read ? "bg-background" : "bg-sky-50/50",
        onClick ? "hover:bg-accent/20" : "cursor-default",
      )}
    >
      <div className="mt-0.5 border border-border p-1.5 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold">{item.title}</p>
          {!item.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-destructive" aria-label="Unread notification" /> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
      </div>
    </button>
  );
}
