"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { chatService } from "@/lib/services/chatService";
import { chatImageUploadService } from "@/lib/services/chatImageUploadService";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { ChatMessage as ChatMessageType } from "@/lib/types";

const getDisplayName = (user: any) => {
  if (!user) return "You";
  const first = user.firstName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  const name = user.name?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ") || name || user.email || "You";
};

export default function TripChatPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthCacheStore((state) => state.currentUser);
  const token = useAuthCacheStore((state) => state.token);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [trip, setTrip] = useState<TripApiItem | null>(null);
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(() => getDisplayName(currentUser), [currentUser]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [tripResult, groupResult] = await Promise.all([
          tripApiService.getTripById(id, token ?? ""),
          chatService.getTripChatGroup(id, token ?? undefined),
        ]);

        if (!mounted) return;

        setTrip(tripResult.data ?? null);
        const group = groupResult.data ?? null;
        setChatGroupId(group?.id ?? null);

        if (!group?.id) {
          setMessages([]);
          setError("No chat group is available for this trip yet.");
          return;
        }

        const messagesResult = await chatService.getMessages(group.id, token ?? undefined);
        if (!mounted) return;
        setMessages(messagesResult.data ?? []);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load chat.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [id, token]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const tripTitle = trip?.tripName ?? "Trip chat";
  const tripSummary = trip?.description ?? trip?.mainDestinations?.[0]?.name ?? trip?.startLocation ?? "Coordinate your trip here.";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatGroupId) {
      setError("No chat group is available for this trip.");
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile) return;

    setSending(true);
    setError("");

    try {
      let imageUrl = "";
      if (selectedFile) {
        imageUrl = (await chatImageUploadService.uploadChatImage(selectedFile, id)) ?? "";
      }

      const result = await chatService.sendMessage(
        chatGroupId,
        {
          tripId: id,
          senderId: currentUser?.id ?? "",
          senderName: displayName,
          message: trimmedText,
          ...(imageUrl ? { imageUrl } : {}),
        },
        token ?? undefined,
      );

      setMessages((prev) => [...prev, result.data]);
      setText("");
      setSelectedFile(null);
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tripTitle} description={tripSummary} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="flex min-h-[68vh] flex-col border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium">Trip chat</p>
            <p className="text-xs text-muted-foreground">
              Messages and images are shared with the organizer and everyone who booked this trip.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading chat...
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUser?.id}
                />
              ))
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-border p-3">
            {imagePreview ? (
              <div className="mb-3 overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Selected attachment preview" className="h-40 w-full object-cover" />
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent">
                <ImagePlus className="size-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type a message"
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={sending || loading || (!text.trim() && !selectedFile)}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </form>
        </section>

        <aside className="border border-border bg-card p-4">
          <h2 className="font-semibold">Trip info</h2>
          <p className="mt-2 text-sm text-muted-foreground">Trip ID: {id}</p>
          <p className="mt-1 text-sm text-muted-foreground">Chat group: {chatGroupId ?? "Loading..."}</p>
          <p className="mt-1 text-sm text-muted-foreground">Organizer: {trip?.organizer ?? "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Members: {(trip?.participants?.length ?? 0) + 1}</p>
          <p className="mt-1 text-sm text-muted-foreground">Dates: {trip?.startDate ?? "--"} to {trip?.endDate ?? "--"}</p>
        </aside>
      </div>
    </div>
  );
}
