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

  const sockRef = useRef<Socket | null>(null);
  const joined = useRef(false);
 
  useEffect(()=>{
    if (!token || joined.current) return;
    joined.current = true;
    
    const socket = io({path: "/socket.io",  // often helps behind proxies
    });

    socket.on("connect", () => {
      
      
      socket.emit("join-session", { sessionId: token });
      console.log("А Бибушка улетел ?")
    });
    
    



    sockRef.current = socket;

    const onValidated = ({ sessionId }: { sessionId: string }) => {
      console.log("I'm in onValidated")
      
      if (sessionId !== token) return;   // ignore other sessions
      navigate("/chat", { replace: true });
      
    };




    const onExpired = () => {
      // show "QR expired" and regenerate if you want
    };
    
    socket.on("connect", () => console.log("client connected:", socket.id));
    socket.on("session-validated", onValidated);
    socket.on("session-expired", onExpired);
    socket.on("connect_error", (err) => console.error("connect_error:", err));
    

    return () => {
      socket.off("session-validated", onValidated);
      socket.off("session-expired", onExpired);
      socket.disconnect();
    };


  },[token, navigate])

  return(<div style={{background:"#fff",width:"350px",height:"350px",margin:"auto auto",padding:"16px"}}>

      <QRCodeSVG id="myqrcode" level="H"   value={scanUrl} size={300} marginSize={8} />
    </div>)



}