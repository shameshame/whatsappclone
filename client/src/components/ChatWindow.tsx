import { useState } from "react"
import type { User } from "@/types/user"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from "@/components/ui/button"
import { Avatar,AvatarImage} from "@/components/ui/avatar"
import { ChatSearch } from "./ChatSearch";
import { Send, Search,VideoIcon,VideoOffIcon,ChevronDown,MoreVertical  } from "lucide-react"
import MessageBubble from "./MessageBubble"


interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}



const users = [
  {
    id: "userA",
    name: "Alice",
    avatar: "https://i.pravatar.cc/150?u=alice"
  },
  {
    id: "userB",
    name: "Bob",
    avatar: "https://i.pravatar.cc/150?u=bob"
  }
];

const userMap = new Map<string,User>(users.map((user) => [user.id, user]))


export default function ChatWindow(){
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [currentUser, setCurrentUser] = useState<User>({id:"",name:"",avatar:""});

    

  const sendMessage = () => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      senderId: currentUser.id,
      timestamp: Date.now()
    };
    
    
    if (input.trim()){
      setMessages([...messages, newMessage])
      setInput("")
    }
  }





  return(<div className="flex-1 bg-[#f7f1ea] flex flex-col  h-screen">
        <div className="flex justify-between items-center bg-white p-4 shadow-sm ">
          <div className="flex items-center gap-3 px-4">
          <Avatar className="w-16 h-16"><AvatarImage src="https://i.pravatar.cc/150?u=alice" className="w-full h-full object-cover"/></Avatar>
          <span className="text-lg font-medium">Alice</span>
        </div>
          <div className="flex items-center gap-3">
            <div className="flex ">
                <VideoIcon/>
                <ChevronDown/>
            </div>
           
            <ChatSearch  messages={messages}/>
            
            <MoreVertical/>
          </div>
        </div>
       

     

       {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-8  h-screen">
        {messages.map((message, index) => {
            const isMe = message.senderId === currentUser?.id;
            const sender = userMap.get(message.senderId)

            return (<MessageBubble key={message.id} text={message.text} timestamp={message.timestamp} isMe={isMe} avatarUrl={sender?.avatar}/>);
        })}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t p-2 flex items-center gap-2">
        <Input
          placeholder="Type a message"
          className="bg-white"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>

        {/* <div className="flex-1 p-4"></div> */}

        {/* <div className="m-4 h-10 bg-gray-300 rounded-full" /> */}
      </div>)


}