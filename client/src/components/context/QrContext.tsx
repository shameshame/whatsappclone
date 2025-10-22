// src/QrContext.tsx
import React, { createContext, useContext, useState,useEffect, useCallback, useMemo, useRef } from "react";
import {QRContextType} from "@/types/qrcontext"
import { useSearchParams,useLocation } from "react-router";
import { DeviceInfo } from "@/types/device";
import { SessionTuple } from "@/types/sessionTuple";



const QrContext = 
createContext<QRContextType>(
                             {
                              validated:false,
                              session:{sid:"",challenge:"",ttl:-2},
                              error:null,
                              validate:async (payload:{ sessionId:string, challenge:string, deviceInfo:DeviceInfo}) => new Response(null, { status: 204, statusText: 'No Content' }),
                              createSessionToken:async()=>{return null}
                             }
                            );
export const useQR = () => {
  const token = useContext(QrContext);
  if (token === null) {
    throw new Error("useToken must be inside a TokenProvider");
  }
  return token;
};

export function QrProvider({children}: {children: React.ReactNode;}) {

  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
  const [session,setSession]=useState<SessionTuple | null>(null)
  const [params]=useSearchParams()
  const {pathname}=useLocation()
  const urlSid=params.get("token")
  const urlChallenge=params.get("challenge")
  const [validated, setValidated] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const alreadyCreated = useRef(false);


  let currentController: AbortController | null = null;
  

 async function  createSessionToken(){
    

      // if (alreadyCreated.current) return;        // guard Strict Mode double-mount
      //  alreadyCreated.current = true;

      // 1) If URL already has both → use them
    if (urlSid && urlChallenge) {
      setSession({sid:urlSid,challenge:urlChallenge})
      return { sid: urlSid, challenge: urlChallenge };
    }

    let sidToReturnImmediately="",challengeToReturnImmediately=""
    
    if (pathname.startsWith("/qr")) {
        try{
          currentController?.abort();          // cancel any prior one
          currentController = new AbortController();
          const signal = currentController.signal;
          const result = await fetch(`${API_BASE}/session`,{method: "POST",signal})
          const{ sessionId,challenge, ttl }= await result.json()
          sidToReturnImmediately=sessionId
          challengeToReturnImmediately=challenge
          
          setSession({sid:sessionId,ttl,challenge})

        }catch(error){
          setError("Could not create session")
        }
    }

    const sid = (urlSid ?? sidToReturnImmediately) || null;
    const challenge = (urlChallenge ?? challengeToReturnImmediately) || null;
    return sid && challenge ? { sid, challenge } : null;
    
 }

 const validate= useCallback(async (payload: { sessionId: string; challenge: string; deviceInfo?: DeviceInfo }): Promise<Response> =>{
    
      const result = await fetch(`${API_BASE}/session/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload}),
      });
      result.ok ? setValidated(true) : setError("Validation failed")
      return result
 }, [API_BASE])

  
  useEffect(()=>{
      createSessionToken()
      return () => currentController?.abort()
  },[urlSid,pathname])
  
  
  const ctx = useMemo(() => ({session,validated, error, validate,createSessionToken}),
                    [validated, error, validate,session]);
  
  return (
    <QrContext.Provider value={ctx}>
       {children}
    </QrContext.Provider>
  );
}
