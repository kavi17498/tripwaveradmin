import { create } from "zustand";
import { ChatGroup } from "@/lib/types";
import { chatService } from "@/lib/services/chatService";
import { userSessionService } from "@/lib/services/userSessionService";

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
    set({ loading: true, error: null });
    try {
      const token = userSessionService.getToken() ?? undefined;
      const res = await chatService.getChatGroups(token);
      set({ groups: res.data ?? [], selected: (res.data && res.data[0]) ?? null });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load groups', groups: [] });
    } finally {
      set({ loading: false });
    }
  },

  selectGroup: (id: string) => {
    const g = get().groups.find((x) => x.id === id) ?? null;
    set({ selected: g });
  },
}));

export default useChatStore;
