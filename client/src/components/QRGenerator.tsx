import {useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { useQR } from "./context/QrContext";
import {QRCodeSVG} from "qrcode.react";
import {RefreshCw, RotateCw} from "lucide-react"
import { postJSON } from "@/utilities/passkeys";
import { LoginVerifyOK } from "@/types/loginVerifyOk";
import { isSessionId,isAuthCode } from "@/utilities/session";
import { Processing } from "./Processing";
import { SpinnerCustom } from "./ui/spinner";
import { SessionTuple } from "@/types/sessionTuple";
import { useAuth } from "./context/AuthContext";


export default function QRGenerator(){

  
  
//  Token context data
  const {session,createSessionToken} = useQR() 
  const { getMe: refresh } = useAuth();
  
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);
  
  // Local token states
  const [currentSession, setCurrentSession]   = useState<SessionTuple |null>(session);
  const [incomingSession, setIncomingSession] = useState<SessionTuple | null>();
  const [processing, setProcessing] = useState(false);
  const [fading,setFading]=useState(false)
  const active = incomingSession ?? currentSession ?? session;

  
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const frame = useRef<number | null>(null);
  
  const exchangingRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const currentTokenRef = useRef<string | null>(null);  // ← always latest
  const joinedWithRef = useRef<string | null>(null);    // ← what we emitted
  const alreadyJoined = useRef(false);
  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";


const regenerate = async()=>{
  alreadyJoined.current=false;
  let nextSession =await createSessionToken()
  setExpired(false);

  return nextSession
}

const onRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setFading(true); // show full overlay

    // 1) request a fresh token
     let nextSession= await regenerate();
    setIncomingSession(nextSession);

    // 2) one animation frame later, start the cross-fade
    frame.current = requestAnimationFrame(() => {
      // fade/scale swap driven by Tailwind classes below
      setCurrentSession(nextSession);

      // 3) after the transition, clean up overlay state
      setTimeout(() => {
        setIncomingSession(null);
        setIsRefreshing(false);
        setFading(false);     // hide overlay
      }, 320); // just over duration-300
    });
  };

// 1) Create socket once
useEffect(() => {
    const socket = io("/pair",{ path: "/socket.io",withCredentials:true }); // goes via Vite proxy
    socketRef.current = socket;

    const onSessionApproved = async ({ sessionId, authCode }:{sessionId:string,authCode:string}) => {
            console.log("[client] session-approved event received", { sessionId, authCode, joinedWith: joinedWithRef.current });
      
            const invalidInput = !isSessionId(sessionId) || !isAuthCode(authCode)
            const isDifferentSession= joinedWithRef.current && sessionId !== joinedWithRef.current
        
            if (invalidInput || isDifferentSession || exchangingRef.current) return;
            exchangingRef.current = true;
      
          try {
            await postJSON<LoginVerifyOK>("/api/session/exchange", { sessionId, authCode });
            await refresh();
            navigate("/chat", { replace: true });
          } catch (error) {
             exchangingRef.current = false;
             console.error("exchange failed", error);
          }
    };
    
    const onValidated = ({ sessionId }: { sessionId: string }) => {
      console.log("[client] session-validated", { sessionId,currentTokenRef: currentTokenRef.current,joinedWith: joinedWithRef.current, });
      if (sessionId === joinedWithRef.current) 
        if (sessionId === joinedWithRef.current) setProcessing(true);
    };

    const onExpired=({ sessionId }: { sessionId: string }) => {
      if (sessionId !== session?.sid) return;
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
    socket.on("session-approved",onSessionApproved)

    return () => {
      socket.off("session-validated", onValidated);
      socket.off("session-expired",onExpired)
      socket.off("session-approved",onSessionApproved)
      socket.disconnect();
    };
  }, [navigate]);

//Initialize current session
 useEffect(() => {
  if (session && (!currentSession || currentSession.sid !== session.sid)) {
    setCurrentSession(session);
    setExpired(false);
  }
}, [session]);



  // 2) Emit join when we HAVE the token (and on reconnect)
  useEffect(() => {
    const socket = socketRef.current;
    if (!session?.sid || !socket) return;

    const tryJoin = () => {
      if (alreadyJoined.current) return;
      alreadyJoined.current = true;

      joinedWithRef.current = session?.sid
      console.log("[client] emitting join-session with token", session?.sid);
      socket.emit("join-session", { sessionId: session?.sid });
    };

    //Race-proof way to emit join-session exactly once when the socket is connected
    //If it's already connected we'll emit-join session, if it hasn't yet we'll fire one-time listener, once connection is established
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
  }, [session?.sid]);

  // 3) Fallback: check status in case phone validated earlier
  useEffect(() => {
    if (!session?.sid) return;
    
    
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/session/${session?.sid}/status`);
        const { status } = await response.json();
        console.log(status)
        if (status === "validated" || status === "used") {
          console.log("[client] status fallback -> navigate");
          navigate("/chat", { replace: true });
        }
      } catch {}
    })();
  }, [session?.sid, navigate]);

   // Local fallback: expire after TTL if server event is missed
  useEffect(() => {
    if (!active?.ttl || !active?.sid) return;
    setExpired(false);
    const elapse = setTimeout(() => setExpired(true), active?.ttl * 1000);
    return () => clearTimeout(elapse);
  }, [active?.ttl, active?.sid]);


  useEffect(() => {
    currentTokenRef.current = session?.sid ?? null;
  }, [session?.sid]);

  

const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = (sid: string,challenge:string) => 
  `${origin}/scan?sessionId=${encodeURIComponent(sid)}&challenge=${encodeURIComponent(challenge)}`;



return(<div className="relative inline-block rounded-xl shadow-sm" style={{ width: 300, height: 300, margin:"auto auto", background: "#fff" }}>
         
         
      {!session && <SpinnerCustom/>} 
      {processing && <Processing msg="Approved on phone. Finalizing…" />}
         
         {/* CURRENT QR — fades out when we flip `current` */}
      {active  && !expired &&<> <QRCodeSVG
        key={`cur-${active.sid}`}
        value={scanUrl(active.sid as string,active.challenge as string)}
        size={300}
        level="M"
        className="
          absolute inset-0
          transition-all duration-300 ease-out
          opacity-100 scale-100
          data-[fading=true]:opacity-0 data-[fading=true]:scale-95 data-[fading=true]:blur-[1px]
          data-[fading=true]:pointer-events-none
          data-[fading=true]:transition-none
        "
        // mark as fading while a newer code is staged
        data-fading={incomingSession ? "true" : "false"}
      />
      <small className="block mt-2 text-xs text-gray-500">Initial sessionId: {session?.sid}</small>
      </>
      }    
      
      {/* INCOMING QR — staged briefly to fade in */}
      {incomingSession && (<>
        <QRCodeSVG
          key={`next-${active?.sid}`}
          value={scanUrl(active?.sid as string,active?.challenge as string)}
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
        <small className="block mt-2 text-xs text-gray-500">sessionId after refresh: {session?.sid}</small>
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