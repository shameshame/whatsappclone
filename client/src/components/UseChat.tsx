// src/hooks/useDirectChat.ts
import { ChatMessage } from "@shared/types/chatMessage";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { httpErrorFromResponse, toAppError } from "@/utilities/error-utils";
import { useAuth } from "./context/AuthContext";


type HistoryResp = { messages: ChatMessage[]; nextCursor: string | null };

export function useChat(chatId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const {user} =useAuth();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chatSocketRef = useRef<Socket | null>(null);
  

  const loadInitial = useCallback(async () => {
    if (!chatId) return; 
    
    setLoading(true);
    const res = await fetch(`/api/chat/${encodeURIComponent(chatId)}/history?limit=30`, {
      credentials: "include",
    });
    const data = (await res.json()) as HistoryResp;
    setMessages(data.messages);
    setNextCursor(data.nextCursor);
    setLoading(false);
  }, [chatId]);

  const loadMore = useCallback(async () => {
    if (!chatId || !nextCursor) return;
    const url = `/api/chat/${encodeURIComponent(chatId)}/history?limit=30&before=${encodeURIComponent(
      nextCursor
    )}`;
    const res = await fetch(url, { credentials: "include" });
    const data = (await res.json()) as HistoryResp;
    // prepend older messages
    setMessages(prev => [...data.messages, ...prev]);
    setNextCursor(data.nextCursor);
  }, [chatId, nextCursor]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId) throw new Error("No chat selected");
      
      const trimmed = text.trim();
      if (!trimmed) return;

      // optimistic insert
      const tempId = `tmp:${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        chatId: "", // not needed on client
        senderId: user?.id as string,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);

      try {
        const res = await fetch(`/api/chat/${encodeURIComponent(chatId as string)}/send`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        if (!res.ok) throw await httpErrorFromResponse(res);
        const { message } = (await res.json()) as { message: ChatMessage };
        // swap optimistic with server message
        setMessages(prev =>
          prev.map(msg => (msg.id === tempId ? message : msg))
        );
      } catch (error) {
        // remove optimistic on failure
        setMessages(prev => prev.filter(message => message.id !== tempId));
        throw error;
      }
    },
    [chatId]
  );

  const deleteMessage = useCallback(async (chatId: string,messageId: string): Promise<void> => {
   try {   
      // optimistic remove
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      const res = await fetch(
        `/api/chat/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/delete`,
       {method: "DELETE",credentials: "include",});

      if (!res.ok) throw await httpErrorFromResponse(res);
  
    }catch (error:unknown) {
      const appErr = toAppError(error);

      // rollback on failure
      setMessages(prev => prev); // or re-fetch chat, or restore from a backup list
      console.error("Failed to delete message:", appErr);
    }

  },[chatId,setMessages])



  // Socket join/real-time
useEffect(() => {
    const chatSocket = io("/chat",{ path: "/socket.io", withCredentials: true });
    chatSocketRef.current = chatSocket;

    chatSocket.emit("chat:join", {chatId });

    // Event handlers

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

    chatSocket.on("chat:message", onNewIncoming);
    chatSocket.on("dm:update", onUpdate);
    chatSocket.on("dm:delete", onDelete);
    chatSocket.on("dm:sent", onSent);

    return () => {
        chatSocket.emit("chat:leave", {chatId }); //Check this line - should it be chatId or peerId?
        chatSocket.off("chat:message", onNewIncoming);
        chatSocket.off("dm:update", onUpdate);
        chatSocket.off("dm:delete", onDelete);
        chatSocket.off("dm:sent", onSent);
        chatSocket.disconnect();
        chatSocketRef.current = null;
    };
}, [chatId]);

  useEffect(() => { void loadInitial(); }, [loadInitial]);

  return { messages, loading, loadMore, hasMore: !!nextCursor, sendMessage,deleteMessageOnServer: deleteMessage };
}
