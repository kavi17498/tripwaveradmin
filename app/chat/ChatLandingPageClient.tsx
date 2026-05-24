"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import useChatStore from "@/lib/stores/useChatStore";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { ChatMessage } from "@/components/chat/chat-message";
import { Modal } from "@/components/common/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import { chatService } from "@/lib/services/chatService";
import { chatImageUploadService } from "@/lib/services/chatImageUploadService";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { app } from "@/lib/config/firebase";
import { waitForFirebaseUser } from "@/lib/services/firebaseAuthUtils";
import { getFirestore, collection, query as firestoreQuery, where, onSnapshot } from "firebase/firestore";
import type { TripChatContext } from "@/lib/services/chatService";

const sortMessagesByCreatedAt = (items: ChatMessageType[]) => {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.createdAt as any);
    const rightDate = new Date(right.createdAt as any);
    const leftTime = Number.isNaN(leftDate.getTime()) ? 0 : leftDate.getTime();
    const rightTime = Number.isNaN(rightDate.getTime()) ? 0 : rightDate.getTime();
    return leftTime - rightTime;
  });
};

export default function ChatLandingPageClient() {
  const groups = useChatStore((s: any) => s.groups);
  const loadingGroups = useChatStore((s: any) => s.loading);
  const selected = useChatStore((s: any) => s.selected);
  const fetchGroups = useChatStore((s: any) => s.fetchGroups);
  const selectGroup = useChatStore((s: any) => s.selectGroup);

  const currentUser = useAuthCacheStore((s) => s.currentUser);
  const token = useAuthCacheStore((s) => s.token);
  const searchParams = useSearchParams();
  const tripIdParam = searchParams.get("tripId");

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsContext, setDetailsContext] = useState<TripChatContext | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!currentUser) return "You";
    const first = currentUser.firstName?.trim() ?? "";
    const last = currentUser.lastName?.trim() ?? "";
    const name = currentUser.name?.trim() ?? "";
    return [first, last].filter(Boolean).join(" ") || name || currentUser.email || "You";
  }, [currentUser]);

  const getGroupName = (group: any) => {
    if (!group) return "";
    if (group.tripId?.startsWith("dm-") && group.name?.includes("|")) {
      const parts = group.name.split("|").map((p: string) => p.trim());
      const otherName = parts.find((part: string) => {
        const normalizedPart = part.toLowerCase();
        const isMe =
          normalizedPart === displayName.toLowerCase() ||
          (currentUser?.email && normalizedPart === currentUser.email.toLowerCase()) ||
          (currentUser?.firstName && normalizedPart === currentUser.firstName.toLowerCase()) ||
          (currentUser?.lastName && normalizedPart === currentUser.lastName.toLowerCase());
        return !isMe;
      });
      return otherName || parts[0];
    }
    return group.name;
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!tripIdParam || !groups.length) return;

    const matchedGroup = groups.find((group: any) => group.tripId === tripIdParam);
    if (matchedGroup && selected?.id !== matchedGroup.id) {
      selectGroup(matchedGroup.id);
    }
  }, [groups, selectGroup, selected?.id, tripIdParam]);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError("");

    let cleanup = () => {};

    void (async () => {
      const firebaseUser = await waitForFirebaseUser();

      if (firebaseUser) {
        const db = getFirestore(app);
        const q = firestoreQuery(
          collection(db, "chatmessages"),
          where("chatGroupId", "==", selected.id),
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

            setMessages(sortMessagesByCreatedAt(msgs));
            setLoadingMessages(false);
          },
          async (err) => {
            const msg = err?.message ?? "Failed to subscribe to messages";
            setError(msg);
            setLoadingMessages(false);

            const code = (err && (err.code || err?.name)) ?? null;
            if (code === 'permission-denied' || (typeof msg === 'string' && msg.toLowerCase().includes('permission-denied'))) {
              try { if (typeof unsub === 'function') unsub(); } catch {}
              try {
                const res = await chatService.getMessages(selected.id, token ?? undefined);
                setMessages(sortMessagesByCreatedAt((res.data ?? []).map((m: any) => ({ ...m, createdAt: m.createdAt ? new Date(m.createdAt) : new Date(0) }))));
              } catch (e: any) {
                setError(e?.message ?? 'Failed to load messages');
              }
            }
          },
        );

        cleanup = () => {
          try { if (typeof unsub === 'function') unsub(); } catch {}
        };
        return;
      }

      let mounted = true;
      let pollId: number | null = null;

      const loadOnce = async () => {
        try {
          const res = await chatService.getMessages(selected.id, token ?? undefined);
          if (!mounted) return;
          setMessages(sortMessagesByCreatedAt((res.data ?? []).map((m: any) => ({
            ...m,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(0),
          }))));
        } catch (e: any) {
          if (!mounted) return;
          setError(e?.message ?? 'Failed to load messages');
        } finally {
          if (mounted) setLoadingMessages(false);
        }
      };

      void loadOnce();
      pollId = window.setInterval(() => void loadOnce(), 5000);

      cleanup = () => {
        mounted = false;
        if (pollId) window.clearInterval(pollId);
      };
    })();

    return () => cleanup();
  }, [selected, token]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, selected?.id]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const renderAvatar = (name: string, profileImage?: string | null) => {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    if (profileImage) {
      return <img src={profileImage} alt={name} className="size-10 rounded-full object-cover" />;
    }

    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
        {initials || "U"}
      </div>
    );
  };

  const openGroupDetails = async (group: any) => {
    if (!group?.tripId) return;

    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsContext(null);

    try {
      const res = await chatService.getTripChatContext(group.tripId, token ?? undefined);
      setDetailsContext(res.data ?? null);
    } catch {
      setDetailsContext(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeGroupDetails = () => {
    setDetailsOpen(false);
    setDetailsContext(null);
    setDetailsLoading(false);
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
                  <div
                    key={g.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectGroup(g.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectGroup(g.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-md hover:bg-accent/20 flex items-center justify-between cursor-pointer ${selected?.id === g.id ? 'bg-accent/30' : ''}`}
                  >
                    <div>
                      <div className="font-medium text-left">
                        {getGroupName(g)}
                      </div>
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
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="h-[72vh] border border-border bg-card rounded-md p-4 flex flex-col">
              <header className="flex items-center justify-between mb-4">
                <div>
                  {selected ? (
                    <button
                      type="button"
                      onClick={() => void openGroupDetails(selected)}
                      className="text-lg font-semibold hover:underline text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                    >
                      {getGroupName(selected)}
                    </button>
                  ) : (
                    <h2 className="text-lg font-semibold">Select a Chat Group</h2>
                  )}
                  <p className="text-sm text-muted-foreground">{selected ? selected.description : "No chat selected"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{selected ? `Members: ${selected.members?.length ?? 0}` : ""}</div>
              </header>

              <div ref={messagesContainerRef} className="flex-1 overflow-auto space-y-3 pb-4">
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

      <Modal
        open={detailsOpen}
        title={detailsContext?.chatGroup ? getGroupName(detailsContext.chatGroup) : "Chat group details"}
        description={detailsContext ? (detailsContext.trip.tripName === "Direct Message" ? "Private 1-on-1 direct conversation." : detailsContext.trip.tripName) : "Trip summary, organizer, and participants"}
        onClose={closeGroupDetails}
      >
        {detailsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading details...
          </div>
        ) : detailsContext ? (
          <div className="space-y-4">
            {detailsContext.trip.tripName !== "Direct Message" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trip summary</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailsContext.trip.description || detailsContext.trip.mainDestinations?.[0]?.name || detailsContext.trip.startLocation || "Coordinate your trip here."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {detailsContext.trip.startDate} to {detailsContext.trip.endDate}
                </p>
              </div>
            )}

            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {detailsContext.trip.tripName === "Direct Message" ? "Contact Info" : "Organizer"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                {renderAvatar(
                  `${detailsContext.organizer.firstName} ${detailsContext.organizer.lastName}`.trim() || detailsContext.organizer.email || "Organizer",
                  detailsContext.organizer.profileImage,
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {`${detailsContext.organizer.firstName} ${detailsContext.organizer.lastName}`.trim() || detailsContext.organizer.email || "Organizer"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{detailsContext.organizer.email}</p>
                </div>
              </div>
            </div>

            {detailsContext.trip.tripName !== "Direct Message" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participants</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {detailsContext.participants.map(({ participant, profile }) => {
                    const displayName = profile
                      ? `${profile.firstName} ${profile.lastName}`.trim() || profile.email
                      : participant.name;

                    return (
                      <div key={participant.participantId ?? `${participant.name}-${participant.email ?? "na"}`} className="flex items-center gap-3 rounded-md border border-border p-3">
                        {renderAvatar(displayName, profile?.profileImage)}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {participant.email || profile?.email || participant.phone || "Participant"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No details available for this chat group.</p>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
