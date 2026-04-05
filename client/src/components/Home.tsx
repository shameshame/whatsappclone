import { useAuth } from "./context/AuthContext";
import { isLikelyHandheld } from "@/utilities/device";

import { Navigate } from "react-router";


const Home = () => {
  const { status } = useAuth();

  if (status === "loading") return null;

  if (status === "authenticated") {
    return <Navigate to="/chat" replace />;
  }

  const target = isLikelyHandheld() ? "/phone/login" : "/qr";
  return <Navigate to={target} replace />;
};

export default Home;