import {useState } from "react";
import { useSearchParams } from "react-router";
import { useQR } from "./context/QrContext";

import {QRCodeSVG} from "qrcode.react";



export default function QRGenerator(){

  // generate once, on first render, never again:
  
 
  const {token} = useQR()
  const scanUrl = `${window.location.origin}/scan?token=${token}`;
 
  console.log("initial token",token)

  return(<div style={{background:"#fff",width:"350px",height:"350px",margin:"auto auto",padding:"16px"}}>

      <QRCodeSVG id="myqrcode" level="H"   value={scanUrl} size={300} marginSize={8} />
    </div>)



}