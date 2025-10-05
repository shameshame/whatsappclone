// src/pages/Login.tsx

import {useLocation, useNavigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import { isLikelyHandheld } from "@/utilities/device";

const Home = () => {
 
 const {status}=useAuth() // 'authenticated' | 'unauthenticated' | 'loading'
 const navigate = useNavigate()
 const { pathname } = useLocation();

  // If already authenticated, decide where your app should land
  if (status === "authenticated") navigate("/chat",{replace:true})
  

  // Only auto-route from the *home* path
  else if (status === "unauthenticated" && pathname === "/") {
    const target = isLikelyHandheld() ? "/phone/login" : "/qr";
    navigate(target,{replace:true})
  }
 
   return null
};

export default Home;
