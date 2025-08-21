import {useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { useQR } from "./context/QrContext";

import {QRCodeSVG} from "qrcode.react";



export default function QRGenerator(){

  // generate once, on first render, never again:
  
 
  const {token} = useQR()
  const scanUrl = `${window.location.origin}/scan?token=${token}`;
  const navigate = useNavigate();

  const socketRef = useRef<Socket | null>(null);
  const alreadyJoined = useRef(false);
  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";







// 1) Create socket once
useEffect(() => {
    const socket = io({ path: "/socket.io" }); // goes via Vite proxy
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[client] connected:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("[client] connect_error:", err);
    });
    socket.on("reconnect_attempt", (n) => console.log("[client] reconnect_attempt", n));

    const onValidated = ({ sessionId }: { sessionId: string }) => {
      console.log("[client] session-validated", { sessionId, tokenCurrent: token });
      if (sessionId === token) navigate("/chat", { replace: true });
    };
    socket.on("session-validated", onValidated);

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

   return(<div style={{background:"#fff",width:"350px",height:"350px",margin:"auto auto",padding:"16px"}}>

      <QRCodeSVG id="myqrcode" level="H"   value={scanUrl} size={300} marginSize={8} />
    </div>)



}