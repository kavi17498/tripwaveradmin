import { create } from "zustand";
import { ChatGroup } from "@/lib/types";
import { chatService } from "@/lib/services/chatService";
import { userSessionService } from "@/lib/services/userSessionService";
import { app } from "@/lib/config/firebase";
import { waitForFirebaseUser } from "@/lib/services/firebaseAuthUtils";
import { getFirestore, collection, query as firestoreQuery, where, orderBy, onSnapshot } from "firebase/firestore";

interface ChatState {
  groups: ChatGroup[];
  loading: boolean;
  error?: string | null;
  selected?: ChatGroup | null;
  fetchGroups: () => Promise<void>;
  selectGroup: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,
  selected: null,

  fetchGroups: async () => {
    // subscribe to chat summaries for the authenticated user
    set({ loading: true, error: null });
    try {
      const token = userSessionService.getToken();
      const user = localStorage.getItem('tripwaver:user-profile');
      let uid: string | null = null;
      if (user) {
        try {
          const parsed = JSON.parse(user) as any;
          uid = parsed?.id ?? parsed?.uid ?? null;
        } catch {
          uid = null;
        }
      }

      const firebaseUser = await waitForFirebaseUser();

      // If we don't have a uid or Firebase auth never hydrated, fall back to REST
      if (!uid || !firebaseUser) {
        // fallback to REST fetch
        const res = await chatService.getChatGroups(token ?? undefined);
        set({ groups: res.data ?? [], selected: (res.data && res.data[0]) ?? null });
        set({ loading: false });
        return;
      }

      const db = getFirestore(app);
      const q = firestoreQuery(
        collection(db, 'chatgroups'),
        where('members', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc'),
      );

      let unsub: (() => void) | null = null;
      unsub = onSnapshot(
        q,
        (snap) => {
          const groups: ChatGroup[] = [];
          snap.forEach((doc) => {
            const d: any = doc.data();
            groups.push({ id: doc.id, ...d } as ChatGroup);
          });
          set({ groups, selected: groups[0] ?? null, loading: false });
        },
        async (err) => {
          const msg = err?.message ?? 'Failed to subscribe to groups';
          set({ error: msg, loading: false });

          // If permissions denied, unsubscribe and fallback to REST fetch
          const code = (err && (err.code || err?.name)) ?? null;
          if (code === 'permission-denied' || (typeof msg === 'string' && msg.toLowerCase().includes('permission-denied'))) {
            try {
              if (typeof unsub === 'function') unsub();
            } catch {}

            try {
              const res = await chatService.getChatGroups(token ?? undefined);
              set({ groups: res.data ?? [], selected: (res.data && res.data[0]) ?? null });
            } catch {
              // ignore
            }
          }
        },
      );

      // attach unsubscribe so components can optionally call it
      // store it on window for now (simple approach) - components should manage lifecycle
      (window as any).__tripwaver_chatgroups_unsub = unsub;
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load groups', groups: [] });
      set({ loading: false });
    }
  },

  selectGroup: (id: string) => {
    const g = get().groups.find((x) => x.id === id) ?? null;
    set({ selected: g });
    // mark group read on selection
    (async () => {
      try {
        const token = userSessionService.getToken() ?? undefined;
        if (!token || !g) return;
        await chatService.markGroupRead(g.id, token);
      } catch {
        // ignore
      }
    })();
  },
}));

export default useChatStore;
