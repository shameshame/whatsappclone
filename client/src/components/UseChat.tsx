// src/hooks/useDirectChat.ts
import { ChatMessage } from "@shared/types/chatMessage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { useAuth } from "./context/AuthContext";
import { withAuthGuard } from "@/utilities/authErrorBoundary";

type HistoryResp = { messages: ChatMessage[]; nextCursor: string | null };

// Socket payloads (match these on server)
type ChatMessageEvent = { chatId: string; message: ChatMessage; tempId?: string };
type ChatDeletedEvent = { chatId: string; ids: string[] };
type ChatUpdatedEvent = { chatId: string; message: ChatMessage };

const HISTORY_LIMIT = 30;

export function useChat(chatId: string | undefined) {
  const { user, forceLogout } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const lastMessagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    lastMessagesRef.current = messages;
  }, [messages]);

  // Keep these stable and reusable
  const authedFetchJSON = useCallback(
    <T,>(fn: () => Promise<T>) => withAuthGuard(fn, forceLogout),
    [forceLogout]
  );

  const loadInitial = useCallback(() => {
    if (!chatId) return Promise.resolve();

    return authedFetchJSON(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/chat/${encodeURIComponent(chatId)}/history?limit=${HISTORY_LIMIT}`,
          { credentials: "include" }
        );
        if (!res.ok) throw await httpErrorFromResponse(res);

        const data = (await res.json()) as HistoryResp;
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
      } finally {
        setLoading(false);
      }
    });
  }, [chatId, authedFetchJSON]);

  const loadMore = useCallback(() => {
    if (!chatId || !nextCursor) return Promise.resolve();

    return authedFetchJSON(async () => {
      const url =
        `/api/chat/${encodeURIComponent(chatId)}/history` +
        `?limit=${HISTORY_LIMIT}&before=${encodeURIComponent(nextCursor)}`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw await httpErrorFromResponse(res);

      const data = (await res.json()) as HistoryResp;
      setMessages(prev => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
    });
  }, [chatId, nextCursor, authedFetchJSON]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));

      const trimmed = text.trim();
      if (!trimmed) return Promise.resolve();

      const tempId = `tmp:${crypto.randomUUID()}`;

      const optimistic: ChatMessage = {
        id: tempId,
        chatId,
        senderId: user?.id as string,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      // optimistic insert
      setMessages(prev => [...prev, optimistic]);

      return authedFetchJSON(async () => {
        try {
          const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/send`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed, tempId }),
          });

          if (!res.ok) throw await httpErrorFromResponse(res);

          const { message } = (await res.json()) as { message: ChatMessage };

          // swap optimistic with server message
          setMessages(prev => prev.map(m => (m.id === tempId ? message : m)));
        } catch (err) {
          // rollback optimistic on failure
          setMessages(prev => prev.filter(m => m.id !== tempId));
          throw err;
        }
      });
    },
    [chatId, user?.id, authedFetchJSON]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));

      // snapshot BEFORE optimistic change
      const snapshot = lastMessagesRef.current;

      // optimistic remove
      setMessages(prev => prev.filter(m => m.id !== messageId));

      return authedFetchJSON(async () => {
        try {
          const res = await fetch(
            `/api/chat/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/delete`,
            { method: "DELETE", credentials: "include" }
          );
          if (!res.ok) throw await httpErrorFromResponse(res);
        } catch (error) {
          // rollback
          setMessages(snapshot);
          throw error;
        }
      });
    },
    [chatId, authedFetchJSON]
  );

  // SOCKETS: connect once per chatId, join/leave only when chatId exists
  useEffect(() => {
    if (!chatId) return;

    const socket = io("/chat", { path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    const onMessage = (payload: ChatMessageEvent) => {
      if (payload.chatId !== chatId) return;

      setMessages(prev => {
        // If server echoes tempId, reconcile it
        if (payload.tempId) {
          const hasTemp = prev.some(m => m.id === payload.tempId);
          if (hasTemp) return prev.map(message => (message.id === payload.tempId ? payload.message : message));
        }

        // Otherwise avoid duplicates by real id
        if (prev.some(message => message.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
    };

    const onUpdated = (payload: ChatUpdatedEvent) => {
      if (payload.chatId !== chatId) return;
      setMessages(prev => prev.map(m => (m.id === payload.message.id ? payload.message : m)));
    };

    const onDeleted = (payload: ChatDeletedEvent) => {
      if (payload.chatId !== chatId) return;
      setMessages(prev => prev.filter(message => !payload.ids.includes(message.id)));
    };

    socket.on("connect", () => {
      socket.emit("chat:join", { chatId });
    });

    socket.on("chat:message", onMessage);
    socket.on("chat:updated", onUpdated);
    socket.on("chat:deleted", onDeleted);

    return () => {
      socket.emit("chat:leave", { chatId });
      socket.off("chat:message", onMessage);
      socket.off("chat:updated", onUpdated);
      socket.off("chat:deleted", onDeleted);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  // Load history whenever chatId changes
  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    messages,
    loading,
    hasMore: !!nextCursor,
    loadMore,
    sendMessage,
    deleteMessageOnServer: deleteMessage,
  };
}
