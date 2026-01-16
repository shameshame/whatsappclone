// src/hooks/useDirectChat.ts
import { ChatMessage } from "@shared/types/chatMessage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { useAuth } from "../components/context/AuthContext";
import { withAuthGuard } from "@/utilities/authErrorBoundary";
import { ReplyTarget } from "@/types/replyTarget";
import { applyReactionPatch } from "@/utilities/applyReactionPatch";
import { MessageReactionEvent } from "@/types/reaction";

type HistoryResp = { messages: ChatMessage[]; nextCursor: string | null };

// Socket payloads
type ChatMessageEvent = { chatId: string; message: ChatMessage; tempId?: string };
type ChatDeletedEvent = { chatId: string; ids: string[] };
type ChatUpdatedEvent = { chatId: string; message: ChatMessage };

const HISTORY_LIMIT = 30;

export function useChat(chatId: string | undefined) {
  const { user, forceLogout } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const lastMessagesRef = useRef<ChatMessage[]>([]);
  const markReadInFlight = useRef(false);

  const authedFetchJSON = useCallback(
    <T,>(fn: () => Promise<T>) => withAuthGuard(fn, forceLogout),
    [forceLogout]
  );

  // keep rollback snapshot updated
  useEffect(() => {
    lastMessagesRef.current = messages;
  }, [messages]);

  const markAsRead = useCallback(() => {
    if (!chatId) return Promise.resolve();
    if (markReadInFlight.current) return Promise.resolve();

    markReadInFlight.current = true;



    return authedFetchJSON(async () => {
      const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/mark-read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw await httpErrorFromResponse(res);
    });
  }, [chatId, authedFetchJSON]);

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
        markReadInFlight.current = false;
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

  const clearReply = useCallback(() => setReplyTo(null), []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));

      const trimmed = text.trim();
      if (!trimmed) return Promise.resolve();

      const tempId = `tmp:${crypto.randomUUID()}`;
      const replyToId = replyTo?.id ?? null;
      clearReply();

      const optimistic: ChatMessage = {
        id: tempId,
        chatId,
        senderId: user?.id as string,
        text: trimmed,
        createdAt: new Date().toISOString(),
        replyToId,
      };

      setMessages(prev => [...prev, optimistic]);

      return authedFetchJSON(async () => {
        try {
          const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/send`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed, tempId, replyToId }),
          });
          if (!res.ok) throw await httpErrorFromResponse(res);

          const { message } = (await res.json()) as { message: ChatMessage };
          setMessages(prev => prev.map(m => (m.id === tempId ? message : m)));
        } catch (err) {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          throw err;
        }
      });
    },
    [chatId, user?.id, replyTo, clearReply, authedFetchJSON]
  );

  const updateMessage = useCallback(
    (messageId: string, text: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));
      const trimmed = text.trim();
      if (!trimmed) return Promise.reject(new Error("Empty message"));

      const snapshot = lastMessagesRef.current;

      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, text: trimmed } : m))
      );

      return authedFetchJSON(async () => {
        try {
          const res = await fetch(
            `/api/chat/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/edit`,
            {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: trimmed }),
            }
          );
          if (!res.ok) throw await httpErrorFromResponse(res);

          const data = (await res.json()) as { message: ChatMessage };
          setMessages(prev => prev.map(m => (m.id === messageId ? data.message : m)));
          return data.message;
        } catch (err) {
          setMessages(snapshot);
          throw err;
        }
      });
    },
    [chatId, authedFetchJSON]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));
      const snapshot = lastMessagesRef.current;

      setMessages(prev => prev.filter(m => m.id !== messageId));

      return authedFetchJSON(async () => {
        try {
          const res = await fetch(
            `/api/chat/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/delete`,
            { method: "DELETE", credentials: "include" }
          );
          if (!res.ok) throw await httpErrorFromResponse(res);
        } catch (err) {
          setMessages(snapshot);
          throw err;
        }
      });
    },
    [chatId, authedFetchJSON]
  );

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      if (!chatId) return Promise.reject(new Error("No chat selected"));

      return authedFetchJSON(async () => {
        const res = await fetch(
          `/api/chat/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/react`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          }
        );
        if (!res.ok) throw await httpErrorFromResponse(res);
        return (await res.json()) as { ok: true };
      });
    },
    [chatId, authedFetchJSON]
  );

  // SOCKETS
  useEffect(() => {
    if (!chatId) return;

    const socket = io("/chat", { path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    const onMessage = (payload: ChatMessageEvent) => {
      if (payload.chatId !== chatId) return;

      setMessages(prev => {
        if (payload.tempId && prev.some(m => m.id === payload.tempId)) {
          return prev.map(m => (m.id === payload.tempId ? payload.message : m));
        }
        if (prev.some(m => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
    };

    const onUpdated = (payload: ChatUpdatedEvent) => {
      if (payload.chatId !== chatId) return;
      setMessages(prev => prev.map(m => (m.id === payload.message.id ? payload.message : m)));
    };

    const onDeleted = (payload: ChatDeletedEvent) => {
      if (payload.chatId !== chatId) return;
      setMessages(prev => prev.filter(m => !payload.ids.includes(m.id)));
    };

    const onReaction = (payload: MessageReactionEvent) => {
      if (payload.chatId !== chatId) return;

      setMessages(prev =>
        applyReactionPatch(prev, {
          messageId: payload.messageId,
          emoji: payload.emoji,
          summary: payload.summary?.count > 0 ? payload.summary : undefined,
        })
      );
    };

    socket.on("connect", () => socket.emit("chat:join", { chatId }));
    socket.on("chat:message", onMessage);
    socket.on("chat:updated", onUpdated);
    socket.on("chat:deleted", onDeleted);
    socket.on("message:reaction", onReaction);

    return () => {
      socket.emit("chat:leave", { chatId });
      socket.off("chat:message", onMessage);
      socket.off("chat:updated", onUpdated);
      socket.off("chat:deleted", onDeleted);
      socket.off("message:reaction", onReaction);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    messages,
    loading,
    hasMore: !!nextCursor,

    loadMore,
    sendMessage,
    deleteMessage,
    updateMessage,
    reactToMessage,

    replyTo,
    setReplyTo,
    clearReply,

    markAsRead, // ✅ exported, UI decides *when*
  };
}
