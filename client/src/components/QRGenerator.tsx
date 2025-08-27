import {useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { useQR } from "./context/QrContext";
import {QRCodeSVG} from "qrcode.react";
import {RefreshCw, RotateCw} from "lucide-react"



export default function QRGenerator(){

  
  
//  Token context data
  const {token,createSessionToken,ttl} = useQR() 
  
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);
  
  // Local token states
  const [currentToken, setCurrentToken]   = useState(token);
  const [incomingToken, setIncomingToken] = useState<string | null>(null);
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const frame = useRef<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const alreadyJoined = useRef(false);
  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";


const regenerate = async()=>{
  alreadyJoined.current=false;
  await createSessionToken()
  setExpired(false);
}

const onRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    // 1) request a fresh token
    await regenerate();
    setIncomingToken(token);

    // 2) one animation frame later, start the cross-fade
    frame.current = requestAnimationFrame(() => {
      // fade/scale swap driven by Tailwind classes below
      setCurrentToken(token);

      // 3) after the transition, clean up overlay state
      setTimeout(() => {
        setIncomingToken(null);
        setIsRefreshing(false);
      }, 320); // just over duration-300
    });
  };


// 

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
      console.log("I 'm in Reconnect")
      
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

  

const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = (token: string) => `${origin}/scan?token=${encodeURIComponent(token)}`;



return(<div className="relative inline-block rounded-xl shadow-sm" style={{ width: 300, height: 300, margin:"auto auto", background: "#fff" }}>
         {/* CURRENT QR — fades out when we flip `current` */}
      {!expired &&<> <QRCodeSVG
        key={`cur-${currentToken}`}
        value={scanUrl(currentToken as string)}
        size={300}
        level="M"
        className="
          absolute inset-0
          transition-all duration-300 ease-out
          opacity-100 scale-100
          data-[fading=true]:opacity-0 data-[fading=true]:scale-95 data-[fading=true]:blur-[1px]
          data-[fading=true]:pointer-events-none
        "
        // mark as fading while a newer code is staged
        data-fading={incomingToken ? "true" : "false"}
      />
      <small className="block mt-2 text-xs text-gray-500">Initial sessionId: {token}</small>
      </>
      }    
      
      {/* INCOMING QR — staged briefly to fade in */}
      {incomingToken && (<>
        <QRCodeSVG
          key={`next-${incomingToken}`}
          value={scanUrl(incomingToken as string)}
          size={300}
          level="M"
          className="
            absolute inset-0
            transition-all duration-300 ease-out
            opacity-0 scale-105 blur-[1px]
            data-[show=true]:opacity-100 data-[show=true]:scale-100 data-[show=true]:blur-0
          "
          data-show="true"
        />
        <small className="block mt-2 text-xs text-gray-500">sessionId after refresh: {token}</small>
        </>
      )}

      {expired && !isRefreshing &&
       (<button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh"
          className="w-full h-full flex items-center justify-center rounded-xl bg-black text-white
                     hover:bg-black/90 active:scale-95 transition outline-none focus-visible:ring-2 
                     focus-visible:ring-white/60
                    "
        >
            <RotateCw className="w-16 h-16" />
        </button>
        )
        }

        {/* While refreshing: dim & spin */}
      {isRefreshing && (
        <div className="absolute inset-0 rounded-xl bg-black/25 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin motion-reduce:animate-none text-white" />
        </div>
      )}
      
    </div>)



}