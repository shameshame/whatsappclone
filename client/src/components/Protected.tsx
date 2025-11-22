import { useAuth } from "./context/AuthContext";
import { Navigate,useLocation} from "react-router";

export default function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAuth(); // { status: 'authenticated' | 'unauthenticated' | 'loading', ... }
  const here = useLocation().pathname;
  
  if (auth.status === "loading") return null; // or a spinner

  if (auth.status === "unauthenticated") {
   
    here.startsWith("/phone")  ? <Navigate to="/phone/login" replace />: <Navigate to="/qr" replace />;
    
  }
  return <>{children}</>;
}
