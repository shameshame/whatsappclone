import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Home from "./Home";
import { useState } from "react";


export default function LoginPage() {

const [phone, setPhone] = useState("");

  return (
    
    <div className="min-h-screen w-full flex items-center justify-center bg-[#faf0e6] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-4">Login to WhatsApp</h1>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="text-center mt-6">
            
            <Home/>
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                alert(`Logging in with phone: ${phone}`);
              }}
              className="space-y-4"
            >
              <label className="text-sm font-medium block">Phone Number</label>
              <Input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
              />
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    
    
    )
}