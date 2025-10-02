import { AuthStatus } from "@/types/authContext";
import { ReactNode,createContext, useContext, useState,useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";


const AuthContext = createContext<AuthStatus>({status:"unauthenticated",user:undefined,device:undefined})

export const useAuth = () => {
  const authStatus = useContext(AuthContext);
  if (authStatus === null) {
    throw new Error("Auth error");
  }
  return authStatus;
};

export function AuthProvider({children}: {children: React.ReactNode;}){

   const [auth,setAuth]=useState<AuthStatus>({status:"",user:"",device:""})
   const navigate=useNavigate()

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
      navigate("/phone/login",{replace:true})
    }
  })();
}, [])

return (<AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
        
       )




}
