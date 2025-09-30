// src/pages/Login.tsx
import {useEffect, useState,useRef  } from "react";
import {useMediaQuery} from "usehooks-ts"
import { createSearchParams, useNavigate } from "react-router";
import { useQR } from "./context/QrContext";
import { useAuth } from "./context/AuthContext";

const Home = () => {
 const isMobileOrTablet=useMediaQuery(`(max-width: 1024px)`)
 const {token}=useQR()
 const authStatus=useAuth()
 const navigate = useNavigate()

 
 function navigateTo(){
     
     let to=""

     if(isMobileOrTablet){
      to = authStatus.status==="authenticated" ? `/scan?token=${token}` : "/phone/login"
     }
     else
        to="/register"
     
     return to;
  }


 useEffect(() => {
    
    navigate(navigateTo(), { replace: true });
  }, [isMobileOrTablet, navigate]);

  return null
};

export default Home;
