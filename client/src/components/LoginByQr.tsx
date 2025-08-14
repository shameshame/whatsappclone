// src/pages/Login.tsx
import {useEffect, useState,useRef  } from "react";
import {useMediaQuery} from "usehooks-ts"
import { createSearchParams, useNavigate } from "react-router";
import { useQR } from "./context/QrContext";

const LoginByQR = () => {
 const isMobileOrTablet=useMediaQuery(`(max-width: 1024px)`)
 const {token}=useQR()
 const navigate = useNavigate()

 


useEffect(() => {
    
    const to = isMobileOrTablet ? `/scan?token=${token}` : `/qr`;
    
    navigate(to, { replace: true });
  }, [isMobileOrTablet, navigate]);




  return null
};

export default LoginByQR;
