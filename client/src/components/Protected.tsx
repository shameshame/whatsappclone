import { useAuth } from "./context/AuthContext";
import { useLocation,useNavigate } from "react-router";

export default function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAuth(); // { status: 'authenticated' | 'unauthenticated' | 'loading', ... }
  const here = useLocation().pathname;
  const navigate = useNavigate()
  if (auth.status === "loading") return null; // or a spinner

  if (auth.status === "unauthenticated") {
   
    here.startsWith("/phone") ? navigate("/phone/login",{replace:true}) : navigate("/qr",{replace:true})
    
  }
  return <>{children}</>;
}
