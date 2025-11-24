
type ChatItemProps = {
  name: string;
  message?:string,
  
};


export default function ChatItem({ name, message }:ChatItemProps){


    return ( <div className="flex items-start gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
    <div className="w-10 h-10 bg-gray-300 rounded-full" />
    <div className="text-sm">
      <p className="text-left font-medium">{name}</p>
      <div className="text-left text-gray-500 text-xs truncate max-w-[220px]">
        {message}
      </div>
    </div>
  </div>)
}