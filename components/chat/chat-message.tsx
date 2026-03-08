import { ChatMessage as ChatMessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage?: boolean;
}

export function ChatMessage({ message, isOwnMessage = false }: ChatMessageProps) {
  return (
    <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[70%] border border-border p-3", isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card") }>
        <p className="mb-1 text-xs font-medium opacity-80">{message.senderName}</p>
        <p className="text-sm leading-relaxed">{message.message}</p>
        {message.imageUrl ? <img src={message.imageUrl} alt="Attachment" className="mt-2 h-24 w-full object-cover" /> : null}
        <p className="mt-2 text-right text-[10px] opacity-70">{new Date(message.createdAt).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
