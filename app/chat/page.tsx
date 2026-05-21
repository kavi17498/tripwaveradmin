"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import useChatStore from "@/lib/stores/useChatStore";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { ChatMessage } from "@/components/chat/chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import { chatService } from "@/lib/services/chatService";
import { chatImageUploadService } from "@/lib/services/chatImageUploadService";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { app, auth } from "@/lib/config/firebase";
import { getFirestore, collection, query as firestoreQuery, where, orderBy, onSnapshot } from "firebase/firestore";

export default function ChatLandingPage() {
  const groups = useChatStore((s: any) => s.groups);
  const loadingGroups = useChatStore((s: any) => s.loading);
  const selected = useChatStore((s: any) => s.selected);
  const fetchGroups = useChatStore((s: any) => s.fetchGroups);
  const selectGroup = useChatStore((s: any) => s.selectGroup);

  const currentUser = useAuthCacheStore((s) => s.currentUser);
  const token = useAuthCacheStore((s) => s.token);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    if (!currentUser) return "You";
    const first = currentUser.firstName?.trim() ?? "";
    const last = currentUser.lastName?.trim() ?? "";
    const name = currentUser.name?.trim() ?? "";
    return [first, last].filter(Boolean).join(" ") || name || currentUser.email || "You";
  }, [currentUser]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError("");

    // Use Firestore realtime subscription only when the Firebase client is signed-in
    if (auth?.currentUser) {
      const db = getFirestore(app);
      const q = firestoreQuery(
        collection(db, "chatmessages"),
        where("chatGroupId", "==", selected.id),
        orderBy("createdAt", "asc"),
      );

      let unsub: (() => void) | null = null;
      unsub = onSnapshot(
        q,
        (snap) => {
          const msgs: ChatMessageType[] = [];
          snap.forEach((doc) => {
            const data: any = doc.data();
            const createdAt = data?.createdAt && typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate()
              : data?.createdAt
              ? new Date(data.createdAt)
              : new Date(0);

            msgs.push({ id: doc.id, ...data, createdAt } as ChatMessageType);
          });

          setMessages(msgs);
          setLoadingMessages(false);
        },
        async (err) => {
          const msg = err?.message ?? "Failed to subscribe to messages";
          setError(msg);
          setLoadingMessages(false);

          const code = (err && (err.code || err?.name)) ?? null;
          if (code === 'permission-denied' || (typeof msg === 'string' && msg.toLowerCase().includes('permission-denied'))) {
            try { if (typeof unsub === 'function') unsub(); } catch {}
            // fallback to REST fetch once
            try {
              const res = await chatService.getMessages(selected.id, token ?? undefined);
              setMessages((res.data ?? []).map((m: any) => ({ ...m, createdAt: m.createdAt ? new Date(m.createdAt) : new Date(0) })));
            } catch (e: any) {
              setError(e?.message ?? 'Failed to load messages');
            }
          }
        },
      );

      return () => {
        try { if (typeof unsub === 'function') unsub(); } catch {}
      };
    }

    // Fallback: fetch messages through backend REST (requires Authorization token) and poll
    let mounted = true;
    let pollId: number | null = null;

    const loadOnce = async () => {
      try {
        const res = await chatService.getMessages(selected.id, token ?? undefined);
        if (!mounted) return;
        setMessages((res.data ?? []).map((m: any) => ({
          ...m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(0),
        })));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load messages');
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };

    void loadOnce();
    // Poll every 5 seconds for new messages when realtime isn't available
    pollId = window.setInterval(() => void loadOnce(), 5000);

    return () => {
      mounted = false;
      if (pollId) window.clearInterval(pollId);
    };
  }, [selected, token]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const send = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!selected?.id) return;
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;

    setSending(true);
    setError("");

    try {
      let imageUrl = "";
      if (selectedFile) {
        // upload under trip context if available
        imageUrl = (await chatImageUploadService.uploadChatImage(selectedFile, selected?.tripId ?? "")) ?? "";
      }

      const res = await chatService.sendMessage(
        selected.id,
        {
          tripId: selected.tripId ?? "",
          senderId: currentUser?.id ?? "",
          senderName: displayName,
          message: trimmed,
          ...(imageUrl ? { imageUrl } : {}),
        },
        token ?? undefined,
      );

      setMessages((m) => [...m, res.data]);
      setText("");
      setSelectedFile(null);
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside>
            <div className="h-[72vh] border border-border bg-card rounded-md p-4 flex flex-col">
              <h3 className="text-md font-semibold mb-3">Chat Groups</h3>

              <div className="flex-1 overflow-auto space-y-2">
                {loadingGroups && <div className="text-sm text-muted-foreground">Loading groups...</div>}
                {!loadingGroups && groups.length === 0 && <div className="text-sm text-muted-foreground">No chat groups found.</div>}

                {groups.map((g: any) => (
                  <button
                    key={g.id}
                    onClick={() => selectGroup(g.id)}
                    className={`w-full text-left p-3 rounded-md hover:bg-accent/20 flex items-center justify-between ${selected?.id === g.id ? 'bg-accent/30' : ''}`}>
                    <div>
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.adminName ?? '—'}</div>
                    </div>
                    <div className="text-xs flex items-center gap-2">
                      {typeof g.unreadCounts === 'object' && currentUser ? (
                        (() => {
                          const uid = currentUser.id as string;
                          const count = (g.unreadCounts?.[uid] ?? 0) as number;
                          return (
                            <span className="inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                              {count > 9 ? '9+' : count}
                            </span>
                          );
                        })()
                      ) : null}
                      {g.adminId === currentUser?.id ? <span className="px-2 py-1 rounded bg-green-100 text-green-800">Admin</span> : null}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">Fetched from /chatgroups</div>
            </div>
          </aside>

          <section>
            <div className="h-[72vh] border border-border bg-card rounded-md p-4 flex flex-col">
              <header className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selected ? selected.name : "Select a Chat Group"}</h2>
                  <p className="text-sm text-muted-foreground">{selected ? selected.description : "No chat selected"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{selected ? `Members: ${selected.members?.length ?? 0}` : ""}</div>
              </header>

              <div className="flex-1 overflow-auto space-y-3 pb-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" /> Loading messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => (
                    <ChatMessage key={m.id} message={m} isOwnMessage={m.senderId === currentUser?.id} />
                  ))
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
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
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1"
                    disabled={!selected}
                  />

                  <Button type="submit" disabled={!selected || sending || (!text.trim() && !selectedFile)}>
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>

                {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
              </form>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
