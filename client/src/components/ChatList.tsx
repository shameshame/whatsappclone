import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import ChatItem from "./ChatItem";
import { ChatMore } from "./ChatMore";
import { NewChatSticky } from "./NewChat";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { ChatSummary } from "@shared/types/chatSummary";


export default function ChatList(){

 const [searchTerm, setSearchTerm] = useState('');
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
    const nameMatches = chat.name.toLowerCase().includes(term);
    const messageMatches = chat.messages.some(msg =>
      msg.text.toLowerCase().includes(term)
    );
    return nameMatches || messageMatches;
  });

  const onChatClick = (peerId: string) => navigate(`/chat/${peerId}`,{ replace: true });
 
 
 
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

              return (
                <div
                  role="button"
                  key={chat.id}
                  onClick={() => onChatClick(chat.id)}   // or getPeerId(chat) for DM
                  className="cursor-pointer"
                >
                  <ChatItem
                    name={chat.name ?? "Unnamed chat"}
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
        ? filteredChats.map(chat => (
          <li key={chat.peerId} className="p-4 bg-gray-100 rounded">
            <p className="font-semibold mb-1">{chat.name}</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {chat.messages.filter(msg =>msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(msg => (
                  <li key={msg.id}>• {msg.text}</li>
                ))} 
            </ul>
          </li>
          
        ))
        :<li className="text-gray-400 italic">No chats found.</li>}

        <NewChatSticky/>
        
        </div>

}