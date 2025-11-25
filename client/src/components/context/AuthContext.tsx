import { AuthStatus,AuthContextValue  } from "@/types/authContext";
import { ReactNode,createContext, useContext, useState,useEffect, useCallback} from "react";



const AuthContext = createContext<AuthContextValue>({status:"loading",user:undefined,device:undefined, refresh:async()=>{}});

export const useAuth = () => {
  const authStatus = useContext(AuthContext);
  if (authStatus === null) {
    throw new Error("Auth error");
  }
  return authStatus;
};

export function AuthProvider({children}: {children: ReactNode;}){

   const [auth,setAuth]=useState<AuthStatus>({status:"",user:undefined,device:undefined})

   // run once on app load to decide if “phone is logged in”
const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session/me", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));

      const data = await res.json();
      setAuth({
        status: "authenticated",
        user: data.user,
        device: data.device,
        
      });
    } catch {
      setAuth({
        status: "unauthenticated",
        user: undefined,
        device: undefined,
      });
    }
  }, []);

  // run once on app load
  useEffect(() => {
    void refresh();
  }, [refresh]);

return (<AuthContext.Provider value={{ ...auth, refresh }}>{children}</AuthContext.Provider>)




}
