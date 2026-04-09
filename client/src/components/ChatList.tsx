import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { io } from "socket.io-client";

import ChatItem from "./ChatItem";
import { ChatMore } from "./ChatMore";
import { NewChat } from "./NewChat";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { ChatSummary } from "@shared/types/chatSummary";
import { useAuth } from "./context/AuthContext";
import { getMessagePreview } from "@/utilities/getMessagePreview";

export default function ChatList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allChats, setAllChats] = useState<ChatSummary[]>([]);

  const { user } = useAuth();
  const currentUserId = user?.id || "";

  const navigate = useNavigate();
  const here = useLocation().pathname;

  const onChatCreated = ({ chat }: { chat: ChatSummary }) => {
    setAllChats((prev) => {
      if (prev.some((existing) => existing.id === chat.id)) return prev;
      return [chat, ...prev];
    });
  };

  useEffect(() => {
    setSearchTerm("");
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chat/my-chats", {
          credentials: "include",
        });
        if (!response.ok) throw await httpErrorFromResponse(response);

        const data = await response.json();
        setAllChats(data.chats);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };

    void fetchChats();
  }, []);

  useEffect(() => {
    const socket = io("/chat", { path: "/socket.io", withCredentials: true });

    socket.on("chat:created", onChatCreated);

    return () => {
      socket.off("chat:created", onChatCreated);
      socket.disconnect();
    };
  }, []);

  function getPeerName(chat: ChatSummary, currentUserId: string): string {
    if (chat.type === "DM") {
      const peer = chat.participants.find(
        (participant) => participant.id !== currentUserId
      );
      if (!peer) return "";
      return peer.displayName || peer.handle || "";
    }

    return chat.name ?? "";
  }

  const filteredChats = allChats.filter((chat) => {
    const term = searchTerm.toLowerCase();
    const peerName = getPeerName(chat, currentUserId).toLowerCase();
    const lastMessagePreview = getMessagePreview(chat.lastMessage).toLowerCase();

    return (
      peerName.includes(term) ||
      lastMessagePreview.includes(term)
    );
  });

  const onChatClick = (chatId: string) => navigate(`/chat/${chatId}`);

  return (
    <div className="flex w-[350px] flex-col border-r border-gray-200 bg-white">
      <div className="p-4">
        <div className="flex justify-between">
          <h2 className="text-left text-lg font-semibold text-green-500">
            Whatsapp
          </h2>
          {here.startsWith("/phone") && <ChatMore />}
        </div>

        <div className="relative mt-2">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-full border border-green-500 py-2 pl-10 pr-4 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="flex gap-2 px-4">
        {["All", "Unread", "Favorites", "Groups"].map((tab) => (
          <button
            key={tab}
            className="rounded-full bg-gray-200 px-3 py-1 text-sm"
          >
            {tab}
          </button>
        ))}
      </div>

      {searchTerm === "" ? (
        <div className="mt-2 overflow-y-auto">
          {allChats.map((chat) => {
            const unreadCount = chat.me?.unreadCount ?? 0;

            return (
              <div
                role="button"
                key={chat.id}
                onClick={() => onChatClick(chat.id)}
                className="cursor-pointer"
              >
                <ChatItem
                  name={getPeerName(chat, currentUserId) || "Unnamed chat"}
                  unreadCount={unreadCount}
                  lastMessage={chat.lastMessage ?? null}
                />
              </div>
            );
          })}
        </div>
      ) : filteredChats.length ? (
        filteredChats.map((chat) => {
          const peerName = getPeerName(chat, currentUserId);

          return (
            <li key={chat.id} className="rounded bg-gray-100 p-4">
              <p className="mb-1 font-semibold">{peerName}</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• {getMessagePreview(chat.lastMessage)}</li>
              </ul>
            </li>
          );
        })
      ) : (
        <li className="italic text-gray-400">No chats found.</li>
      )}

      <NewChat />
    </div>
  );
}