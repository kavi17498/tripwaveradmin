"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import useChatStore from "@/lib/stores/useChatStore";

export default function ChatLandingPage() {
  const groups = useChatStore((s: any) => s.groups);
  const loading = useChatStore((s: any) => s.loading);
  const selected = useChatStore((s: any) => s.selected);
  const fetchGroups = useChatStore((s: any) => s.fetchGroups);
  const selectGroup = useChatStore((s: any) => s.selectGroup);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const dummyMessages = [
    { id: 'd1', senderName: 'System', message: 'Chats are not implemented yet.', createdAt: new Date().toISOString() },
    { id: 'd2', senderName: 'Alice', message: 'Hello everyone — this is a placeholder chat.', createdAt: new Date().toISOString() },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <section className="lg:col-span-3">
            <div className="h-[72vh] border border-border bg-card rounded-md p-4 flex flex-col">
              <header className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selected ? selected.name : "Select a Chat Group"}</h2>
                  <p className="text-sm text-muted-foreground">{selected ? selected.description : "No chat selected"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{selected ? `Members: ${selected.members?.length ?? 0}` : ""}</div>
              </header>

              <div className="flex-1 overflow-auto space-y-3 pb-4">
                {dummyMessages.map((m) => (
                  <div key={m.id} className="p-3 bg-muted/20 rounded">
                    <div className="text-sm font-medium">{m.senderName}</div>
                    <div className="text-sm text-muted-foreground">{m.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex gap-2">
                  <input className="flex-1 input" placeholder="Type a message (disabled)" disabled />
                  <button className="btn" disabled>Send</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="h-[72vh] border border-border bg-card rounded-md p-4 flex flex-col">
              <h3 className="text-md font-semibold mb-3">Chat Groups</h3>

              <div className="flex-1 overflow-auto space-y-2">
                {loading && <div className="text-sm text-muted-foreground">Loading groups...</div>}
                {!loading && groups.length === 0 && <div className="text-sm text-muted-foreground">No chat groups found.</div>}

                {groups.map((g: any) => (
                  <button
                    key={g.id}
                    onClick={() => selectGroup(g.id)}
                    className={`w-full text-left p-3 rounded-md hover:bg-accent/20 ${selected?.id === g.id ? 'bg-accent/30' : ''}`}>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.adminName ?? '—'}</div>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">Fetched from /chatgroups</div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
