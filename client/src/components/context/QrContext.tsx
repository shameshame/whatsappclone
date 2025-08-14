// src/QrContext.tsx
import React, { createContext, useContext, useState,useEffect, useCallback, useMemo } from "react";
import {QRContextType} from "../../types/qrcontext"
import { useSearchParams,useLocation } from "react-router";

const QrContext = createContext<QRContextType>({token:null,validated:false,error:null,validate:async () => {return false}});
export const useQR = () => {
  const token = useContext(QrContext);
  if (token === null) {
    throw new Error("useToken must be inside a TokenProvider");
  }
  return token;
};

export function QrProvider({children}: {children: React.ReactNode;}) {

  const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
  const [token, setToken]         = useState<string | null>(null);
  const [params]=useSearchParams()
  const {pathname}=useLocation()
  const urlToken=params.get("token")
  const [validated, setValidated] = useState(false);
  const [error, setError]         = useState<string | null>(null);

let currentController: AbortController | null = null;

 async function  createSessionToken(){
     
  
     if(!urlToken){
      if (pathname.startsWith("/qr")) {
        try{
          currentController?.abort();          // cancel any prior one
          currentController = new AbortController();
          const signal = currentController.signal;
          const result = await fetch(`${API_BASE}/session`,{method: "POST",signal})
          const parsedResult = await result.json()
        
          if(parsedResult.sessionId) setToken(parsedResult.sessionId) 

        }catch(error){
          setError("Could not create session")
     }
      }
    }

    else{
      setToken(urlToken)
    }
     
 }

 const validate= useCallback(async (scannedToken: string): Promise<boolean> =>{
    try {
      const result = await fetch(`${API_BASE}/session/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: scannedToken }),
      });
      result.ok ? setValidated(true) : setError("Validation failed")
      return result.ok
      
    } catch {
      setError("Network error");
      return false
    }
 
 }, [API_BASE])

  
  useEffect(()=>{
      createSessionToken()
      return () => currentController?.abort()
  },[urlToken,pathname])
  
  
  const ctx = useMemo(() => ({ token, validated, error, validate }),
                    [token, validated, error, validate]);
  
  return (
    <QrContext.Provider value={ctx}>
       {token ? children : <p>Generating session…</p>}
    </QrContext.Provider>
  );
}
