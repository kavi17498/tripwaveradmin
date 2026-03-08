"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { chatService } from "@/lib/services/chatService";
import { ChatMessage as ChatMessageType } from "@/lib/types";

export default function TripChatPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    chatService.getTripMessages(id).then((result) => setMessages(result.data));
  }, [id]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const result = await chatService.sendMessage({
      tripId: id,
      senderId: "u1",
      senderName: "Maya Fernandes",
      message: text,
    });
    setMessages((prev) => [...prev, result.data]);
    setText("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Trip Group Chat" description="Coordinate logistics and updates with trip members." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <section className="flex h-[520px] flex-col border border-border bg-card">
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} isOwnMessage={message.senderId === "u1"} />
            ))}
          </div>
          <form onSubmit={send} className="border-t border-border p-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="icon">
                <ImagePlus className="size-4" />
              </Button>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type message"
                className="h-9 flex-1 border border-input bg-background px-3 text-sm"
              />
              <Button>Send</Button>
            </div>
          </form>
        </section>

        <aside className="border border-border bg-card p-4">
          <h2 className="font-semibold">Trip Info</h2>
          <p className="mt-2 text-sm text-muted-foreground">Trip ID: {id}</p>
          <p className="mt-1 text-sm text-muted-foreground">Participants: 12</p>
          <p className="mt-1 text-sm text-muted-foreground">Next activity: City briefing</p>
        </aside>
      </div>
    </div>
  );
}
