// src/pages/Login.tsx
import {useEffect, useState,useRef  } from "react";
import {useMediaQuery} from "usehooks-ts"
import { createSearchParams, useNavigate } from "react-router";

const LoginByQR = () => {
 const isMobileOrTablet=useMediaQuery(`(max-width: 1024px)`)
 const tokenRef    = useRef<string | null>(null);
 const navigate = useNavigate()

 if (!tokenRef.current) {
    tokenRef.current = `login-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }


useEffect(() => {
    
    const path = isMobileOrTablet ? "/scan" : "/qr";
    const params = createSearchParams({ token: tokenRef.current! });
    navigate({ pathname: path, search: params.toString() }, { replace: true });
  }, [isMobileOrTablet, navigate]);




  return null
};

export default LoginByQR;
