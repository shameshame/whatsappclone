// src/hooks/useDirectChat.ts
import { ChatMessage } from "@/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// export type ChatMessage = {
//   id: string;
//   chatId: string;
//   senderId: string;
//   text: string;
//   createdAt: string; // ISO
// };

type HistoryResp = { messages: ChatMessage[]; nextCursor: string | null };

export function useDirectChat(peerId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chatSocketRef = useRef<Socket | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/chat/${encodeURIComponent(peerId)}/history?limit=30`, {
      credentials: "include",
    });
    const data = (await res.json()) as HistoryResp;
    setMessages(data.messages);
    setNextCursor(data.nextCursor);
    setLoading(false);
  }, [peerId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const url = `/api/chat/${encodeURIComponent(peerId)}/history?limit=30&before=${encodeURIComponent(
      nextCursor
    )}`;
    const res = await fetch(url, { credentials: "include" });
    const data = (await res.json()) as HistoryResp;
    // prepend older messages
    setMessages(prev => [...data.messages, ...prev]);
    setNextCursor(data.nextCursor);
  }, [peerId, nextCursor]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // optimistic insert
      const tempId = `tmp:${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        chatId: "", // not needed on client
        senderId: "me", // display-only
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);

      try {
        const res = await fetch(`/api/chat/${encodeURIComponent(peerId)}/send`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { message } = (await res.json()) as { message: ChatMessage };
        // swap optimistic with server message
        setMessages(prev =>
          prev.map(msg => (msg.id === tempId ? msg : msg))
        );
      } catch (e) {
        // remove optimistic on failure
        setMessages(prev => prev.filter(message => message.id !== tempId));
        throw e;
      }
    },
    [peerId]
  );

  // Socket join/real-time
useEffect(() => {
    const chatSocket = io({ path: "chat/socket.io", withCredentials: true });
    chatSocketRef.current = chatSocket;

    chatSocket.emit("dm:join", { peerId });

    // New incoming message: append
    const onNewIncoming = (newIncoming: ChatMessage) => {
        setMessages(prev => {
            // avoid duplicates
            if (prev.some(msg => msg.id === newIncoming.id)) return prev;
            return [...prev, newIncoming];
        });
    };

    // Message updated: replace by id
    const onUpdate = (updated: ChatMessage) => {
        setMessages(prev => prev.map(msg => (msg.id === updated.id ? updated : msg)));
    };

    // Message deleted: remove by id or by ids payload
    const onDelete = ( ids : string[]) => {
        setMessages(prev => prev.filter(msg => !ids.includes(msg.id)));
    };

    // Server ack for optimistic send: swap tempId with real message
    // payload: { tempId?: string, message: ChatMessage }
    const onSent = (payload: { tempId?: string; message: ChatMessage }) => {
        const { tempId, message } = payload;
        if (tempId) {
            setMessages(prev => prev.map(msg => (msg.id === tempId ? message : msg)));
        } else {
            // If no tempId, append if not present
            setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
        }
    };

    chatSocket.on("dm:new", onNewIncoming);
    chatSocket.on("dm:update", onUpdate);
    chatSocket.on("dm:delete", onDelete);
    chatSocket.on("dm:sent", onSent);

    return () => {
        chatSocket.emit("dm:leave", { peerId });
        chatSocket.off("dm:new", onNewIncoming);
        chatSocket.off("dm:update", onUpdate);
        chatSocket.off("dm:delete", onDelete);
        chatSocket.off("dm:sent", onSent);
        chatSocket.disconnect();
        chatSocketRef.current = null;
    };
}, [peerId]);

  useEffect(() => { void loadInitial(); }, [loadInitial]);

  return { messages, loading, loadMore, hasMore: !!nextCursor, sendMessage };
}
