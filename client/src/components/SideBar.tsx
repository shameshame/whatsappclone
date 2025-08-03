
import { Camera,MessageSquareMore,UsersRound,Radio } from "lucide-react"


export default function SideBar(){

  return( <aside className="bg-gray-200 border-r border-gray-200 p-4 flex flex-col items-center gap-6">
        <MessageSquareMore className="mt-1"/>
        <Camera/>
        <Radio/>
        <UsersRound />
    </aside>)


}