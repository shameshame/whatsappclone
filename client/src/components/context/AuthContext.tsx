import { AuthStatus } from "@/types/authContext";
import { ReactNode,createContext, useContext, useState,useEffect, useCallback, useMemo, useRef } from "react";


const AuthContext = createContext<AuthStatus>({status:"",user:"",device:""})

export const useAuth = () => {
  const authStatus = useContext(AuthContext);
  if (authStatus === null) {
    throw new Error("Auth error");
  }
  return authStatus;
};

export function AuthProvider({children}: {children: React.ReactNode;}){

   const [auth,setAuth]=useState<AuthStatus>({status:"",user:"",device:""})

   // run once on app load to decide if “phone is logged in”
useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/session/me", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      
      const data = await res.json();
      // logged in – store user in state
      setAuth({ status: "authenticated", user: data.user, device: data.device });
    } catch {
      // not logged in – show registration/login flow
      setAuth({...auth, status: "unauthenticated" });
    }
  })();
}, [])

return (<AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
        
       )




}
