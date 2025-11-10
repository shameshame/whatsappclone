
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function WelcomePanel() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F5DC]">
      <Card className="w-full max-w-lg m-auto rounded-2xl shadow-md bg-white/90">
        <CardContent className="flex flex-col items-center gap-4 p-10">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(180deg,#25D36620,#25D36610)" }}
            aria-hidden
          >
            <Avatar className="w-20 h-20 bg-transparent shadow-none">
              <AvatarImage
                src=""
                alt="whatsapp"
                // svg inside avatar for crisp vector icon
              />
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#25D366]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.373 0 .013 5.36.01 12c0 2.11.55 4.09 1.6 5.86L0 24l6.41-1.59A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.2-1.23-6.15-3.48-8.52z"
                  fill="#25D366"
                />
                <path
                  d="M17.2 14.1c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.78.96-.96 1.15-.18.18-.36.2-.66.07-.3-.13-1.27-.47-2.42-1.48-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2 0-.38-.02-.53-.02-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.53.07-.81.37-.28.3-1.06 1.04-1.06 2.53 0 1.49 1.09 2.93 1.24 3.13.15.2 2.14 3.37 5.18 4.72 3.04 1.34 3.04.9 3.59.84.56-.06 1.76-.72 2.01-1.41.25-.7.25-1.3.18-1.41-.06-.11-.28-.18-.58-.33z"
                  fill="white"
                />
              </svg>
            </Avatar>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-800">Welcome to WhatsAppClone</h1>
            <p className="mt-2 text-sm text-gray-600">
              Messages are end-to-end encrypted. Click a chat on the left to start a conversation.
            </p>
          </div>
         </CardContent>
      </Card>
    </div>
  );
}