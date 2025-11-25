import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import ChatItem from "./ChatItem";
import { ChatMore } from "./ChatMore";
import { NewChatSticky } from "./NewChat";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { ChatSummary } from "@shared/types/chatSummary";
import { useAuth } from "./context/AuthContext";


export default function ChatList(){

 const [searchTerm, setSearchTerm] = useState('');
 const {user} = useAuth(); 
 const currentUserId = user?.id || '';

 const [allChats, setAllChats] = useState<ChatSummary[]>([]);
 const navigate = useNavigate();
 const here = useLocation().pathname;

 useEffect(() => {
    // Reset search term when component mounts
    setSearchTerm('');
  },[])

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chat/my-chats', { credentials: 'include' });
        if (!response.ok) throw httpErrorFromResponse(response);
        
        const data = await response.json();
        setAllChats(data.chats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };    
    fetchChats();
  }, []);


 const filteredChats = allChats.filter(chat => {
    const term = searchTerm.toLowerCase();
    const peerName = getPeerName(chat, currentUserId).toLowerCase();
    const lastMessage = chat.lastMessage?.text?.toLowerCase() ?? "";
    
    return (
    peerName.includes(term) ||
    lastMessage.includes(term)
  );
  });

  const onChatClick = (peerId: string) => navigate(`/chat/${peerId}`,{ replace: true });

  function getPeerName(chat: ChatSummary, currentUserId: string): string {
  if (chat.type === "DM") {
    const peer = chat.participants.find(participant => participant.id !== currentUserId);
    if (!peer) return "";
    return peer.displayName || peer.handle || "";
  }

  // For groups, fall back to chat name
  return chat.name ?? "";
}
 
 
 
 return <div className="w-[350px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <div className="flex justify-between">
            <h2 className="text-lg text-left text-green-500 font-semibold">Whatsapp</h2>
            {here.startsWith("/phone") && <ChatMore/>}
          </div>
          <div className="relative mt-2">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-green-500 rounded-full focus:outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="flex gap-2 px-4">
          {["All", "Unread", "Favorites", "Groups"].map((tab) => (
            <button
              key={tab}
              className="bg-gray-200 text-sm px-3 py-1 rounded-full"
            >
              {tab}
            </button>
          ))}
        </div>

        
         {/* If search input is empty render all the chats */}
        {searchTerm==='' 
         ? 
        <div className="mt-2 overflow-y-auto">
          {allChats.map((chat) => {
              const last = chat.lastMessage;
              let peerName = getPeerName(chat,currentUserId);
              let peerId = chat.participants.find(p => p.displayName === peerName || p.handle === peerName)?.id || ''
              return (
                <div
                  role="button"
                  key={chat.id}
                  onClick={() => onChatClick(peerId)}   // or getPeerId(chat) for DM
                  className="cursor-pointer"
                >
                  <ChatItem
                    name={getPeerName(chat,currentUserId) ?? "Unnamed chat"}
                    message={
                      last?.isDeleted
                        ? "Message deleted"
                        : last?.text ?? ""
                    }
                  />
                </div>
              );
            })}
        </div>
        :
        // If matches are found, render them, otherwise display an appropriate message
        filteredChats.length 
        ? filteredChats.map(chat =>{ 
           let peerName = getPeerName(chat,currentUserId);
           let peerId = chat.participants.find(p => p.displayName === peerName || p.handle === peerName)?.id || '';
           return (<li key={peerId} className="p-4 bg-gray-100 rounded">
                      <p className="font-semibold mb-1">{peerName}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                          <li>• {chat.lastMessage?.text}</li>
                      </ul>
                    </li>
                  )
          })
        :<li className="text-gray-400 italic">No chats found.</li>}

        <NewChatSticky/>
        
        </div>

}