import { useState } from "react";
import type { Chat } from "@/types/chat";
import ChatItem from "./ChatItem";



const allChats : Chat[] = [
  {id:"1" ,name: "Корзина", messages: [{id:"1",text:"Севька сказал в кои-то веки они у нас,пусть они у нас побудут"}] },
  { id:"2",name: "Верочка Харченкова", messages: [{id:"1",text:"С праздником, молодёжь…" }]},
  { id:"3",name: "Анишичер", messages: [{id:"1",text:"У него посиделки, а у меня полежалки…"}] },
  { id:"4",name: "Жопа Срычер", messages: [{id:"1",text:"Это не Витьки звонили, Машка сказала,что они не приезжали" }]},
];





export default function ChatList(){

 const [searchTerm, setSearchTerm] = useState('');
 const [chats] = useState(allChats);

 const filteredChats = allChats.filter(chat => {
    const term = searchTerm.toLowerCase();
    const nameMatches = chat.name.toLowerCase().includes(term);
    const messageMatches = chat.messages.some(msg =>
      msg.text.toLowerCase().includes(term)
    );
    return nameMatches || messageMatches;
  });
 
 
 
 return <div className="w-[350px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <h2 className="text-lg text-left text-green-500 font-semibold">Whatsapp</h2>
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
          {allChats.map((chat) => (
            <ChatItem key={chat.name} name={chat.name} message={chat.messages[chat.messages.length-1].text} />
          ))}
        </div>
        :
        // If matches are found, render them, otherwise display an appropriate message
        filteredChats.length 
        ? filteredChats.map(chat => (
          <li key={chat.id} className="p-4 bg-gray-100 rounded">
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
        
        </div>

}