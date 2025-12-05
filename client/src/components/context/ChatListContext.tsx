// src/chat/ChatContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import type { ChatSummary } from "@shared/types/chatSummary";
import { httpErrorFromResponse } from "@/utilities/error-utils";

type ChatContextValue = {
  allChats: ChatSummary[];
  loadingChats: boolean;
  error?: string;
  getChatList: () => Promise<void>;
  addOrUpdateChat: (chat: ChatSummary) => void;
};

const ChatListContext = createContext<ChatContextValue | null>(null);

export function useChats() {
  const ctx = useContext(ChatListContext);
  if (!ctx) throw new Error("useChats must be used within <ChatProvider>");
  return ctx;
}

export function ChatListProvider({ children }: { children: React.ReactNode }) {
  const [allChats, setAllChats] = useState<ChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [socket, setSocket] = useState<Socket | null>(null);

  const getChatList = useCallback(async () => {
    setLoadingChats(true);
    setError(undefined);
    
    try {
      const res = await fetch("/api/chat/my-chats", { credentials: "include" });
      if (!res.ok) throw await httpErrorFromResponse(res);
      const data = await res.json() as { chats: ChatSummary[] };
      setAllChats(data.chats ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load chats");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    void getChatList();
  }, [getChatList]);

  // helper: add or update chat by id
  const addOrUpdateChat = useCallback((summary: ChatSummary) => {
    setAllChats(prev => {
        const exists = prev.some(chat => chat.id === summary.id);
        
        // new chat → put on top
        if (!exists) return [summary, ...prev];
        
        // existing chat → merge
        return prev.map(chat =>chat.id === summary.id ? { ...chat, ...summary } : chat);
    });
  },[]);
 

  // socket for "chat:created" (and later "chat:message" etc.)
  useEffect(() => {
    const chatListSocket = io("/chat", { path: "/socket.io", withCredentials: true });
    setSocket(chatListSocket);

    const onChatCreated = (payload: { chat: ChatSummary }) => {
      addOrUpdateChat(payload.chat);
    };

    chatListSocket.on("chat:created", onChatCreated);

    return () => {
      chatListSocket.off("chat:created", onChatCreated);
      chatListSocket.disconnect();
      setSocket(null);
    };
  }, [addOrUpdateChat]);

  const chatListCtx: ChatContextValue = {
    allChats,
    loadingChats,
    error,
    getChatList,
    addOrUpdateChat,
  };

  return (
    <ChatListContext.Provider value={chatListCtx}>
      {children}
    </ChatListContext.Provider>
  );
}
