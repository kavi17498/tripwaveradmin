import { Bell, BadgeCheck, Clock3, CreditCard } from "lucide-react";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap = {
  "join-request": BadgeCheck,
  payment: CreditCard,
  reminder: Clock3,
  "account-alert": Bell,
};

interface NotificationItemProps {
  item: Notification;
}

export function NotificationItem({ item }: NotificationItemProps) {
  const Icon = iconMap[item.type] ?? Bell;
  return (
    <article
      className={cn(
        "flex items-start gap-3 border border-border p-4",
        item.read ? "bg-background" : "bg-sky-50/50",
      )}
    >
      <div className="mt-0.5 border border-border p-1.5 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
      </div>
    </article>
  );
}
