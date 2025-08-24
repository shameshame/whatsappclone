import {useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { useQR } from "./context/QrContext";
import {QRCodeSVG} from "qrcode.react";
import {RotateCw} from "lucide-react"



export default function QRGenerator(){

  // generate once, on first render, never again:
  
 
  const {token,createSessionToken,ttl} = useQR()
  const scanUrl = `${window.location.origin}/scan?token=${token}`;
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);




  const socketRef = useRef<Socket | null>(null);
  const alreadyJoined = useRef(false);
  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";


const regenerate = async()=>{
  alreadyJoined.current=false;
  await createSessionToken()
  setExpired(false);
}




// 1) Create socket once
useEffect(() => {
    const socket = io({ path: "/socket.io" }); // goes via Vite proxy
    socketRef.current = socket;

    

    const onValidated = ({ sessionId }: { sessionId: string }) => {
      console.log("[client] session-validated", { sessionId, tokenCurrent: token });
      if (sessionId === token) navigate("/chat", { replace: true });
    };

    const onExpired=({ sessionId }: { sessionId: string }) => {
      if (sessionId !== token) return;
      setExpired(true);     
    }



    socket.on("connect", () => {
      console.log("[client] connected:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("[client] connect_error:", err);
    });
    socket.on("reconnect_attempt", (n) => console.log("[client] reconnect_attempt", n));
    socket.on("session-validated", onValidated);
    socket.on("session-expired",onExpired)

    return () => {
      socket.off("session-validated", onValidated);
      socket.disconnect();
    };
  }, [navigate]);

  // 2) Emit join when we HAVE the token (and on reconnect)
  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !socket) return;

    const tryJoin = () => {
      if (alreadyJoined.current) return;
      alreadyJoined.current = true;
      console.log("[client] emitting join-session with token", token);
      socket.emit("join-session", { sessionId: token });
    };

    //Race-proof way to emit join-session exactly once when the socket is connected
    //If it's already connected we'll emit-join session, if it hasn't yet we'll fire one-time listener, once it has
    (socket.connected) ? tryJoin(): socket.once("connect", tryJoin) ;
    

    // if the socket reconnects (Wi-Fi hiccup), re-emit once
    const onReconnect = () => {
      alreadyJoined.current = false;
      tryJoin();
    };
    socket.on("reconnect", onReconnect);

    return () => {
      socket.off("reconnect", onReconnect);
    };
  }, [token]);

  // 3) Fallback: check status in case phone validated earlier
  useEffect(() => {
    if (!token) return;
    
    
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/session/${token}/status`);
        const { status } = await response.json();
        if (status === "validated" || status === "used") {
          console.log("[client] status fallback -> navigate");
          navigate("/chat", { replace: true });
        }
      } catch {}
    })();
  }, [token, navigate]);

   // Local fallback: expire after TTL if server event is missed
  useEffect(() => {
    if (!ttl || !token) return;
    setExpired(false);
    const elapse = setTimeout(() => setExpired(true), ttl * 1000);
    return () => clearTimeout(elapse);
  }, [ttl, token]);

  







   return(<div style={{background:"#fff",width:"320px",height:"320px",margin:"auto auto",padding:"8px"}}>


      {expired
       ?
       <button
          type="button"
          onClick={regenerate}
          aria-label="Refresh"
          className="w-full h-full flex items-center justify-center rounded-xl bg-black text-white
                     hover:bg-black/90 active:scale-95 transition outline-none focus-visible:ring-2 
                     focus-visible:ring-white/60
                    "
        >
            <RotateCw className="w-16 h-16" />
        </button>
        :
        <QRCodeSVG id="myqrcode" level="H"   value={scanUrl} size={300} marginSize={8} />}
      
    </div>)



}