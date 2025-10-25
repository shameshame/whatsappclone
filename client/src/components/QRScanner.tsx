// src/components/QrScanner.tsx
import { useEffect, useRef, useState } from "react";
import { useQR } from "./context/QrContext";
import { Html5Qrcode,Html5QrcodeSupportedFormats, Html5QrcodeScanType} from "html5-qrcode";
import { loginWithPasskey } from "../utilities/passkeys";
import getDeviceInfoSync from "../utilities/device"


const QrScanner = () => {

  const {validate,session,validated}=useQR()
  
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraId, setCameraId] = useState<string|null>(null);
  const [error, setError] = useState<string | null>(null);
 


  //Guards from re-rendering
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const started = useRef(false);
  const gotResult = useRef(false);
  const inFlight = useRef(false);
  const lastText = useRef<string>("");
  const lastAt = useRef(0);

  




 const extractSessionId = (decoded: string)=>{
   const text = decoded.trim();

   console.log("Decoded",text)

  try {
    const url = new URL(text, window.location.origin);
    // accept either ?sessionId=... or ?token=...
    return {
      sessionId: url.searchParams.get("sessionId") ?? url.searchParams.get("token") ?? "",
      challenge: url.searchParams.get("challenge") ?? "",
    };
  } catch {
    // Not a URL — treat the whole QR as the session id
    const [sessionId, challenge] = text.split(":");
    return { sessionId: sessionId || "", challenge: challenge || "" };
  }
}

const teardown = async () => {
    let closed = false;
    if (closed) 
      return;
    
    closed = true;
    try { await scannerRef.current?.stop(); } catch {}
    try { scannerRef.current?.clear(); } catch {}
};




const onScanSuccess = async (decoded: string) => {
      // debounce identical frames for 1.5s
      const now = Date.now();
      if (decoded === lastText.current && now - lastAt.current < 1500) return;
      lastText.current = decoded;
      lastAt.current = now;

      if (gotResult.current || inFlight.current) return;
      inFlight.current = true;

     // extract token if you encoded a URL
      try {
          const { sessionId, challenge } = extractSessionId(decoded);
          if (!sessionId || !challenge) throw new Error("Invalid QR payload");

          const deviceInfo=getDeviceInfoSync()

          // 1st attempt: validate using existing cookies
          let response = await validate({ sessionId, challenge, deviceInfo});

          if (response.ok) {
            gotResult.current = true;
            teardown()
          }
        }catch (err: any) {
            setLogs(l => [...l, `❌ ${err?.message || err}`]);
        } finally {
          inFlight.current = false;
        }

  }







 async function scanHandler(){
    if (!cameraId) return;
    

    if (started.current) return;         // avoid StrictMode double init
    started.current = true;

    const el = document.getElementById("qr-reader");
  if (!el) return;

  // Wait one frame so width/height above are computed
  await new Promise(requestAnimationFrame);
  const box = el.getBoundingClientRect();
  // pick a qrbox that fits the container
  const size = Math.floor(Math.min(box.width, box.height) * 0.9);
  // setLogs(l => [...l, `container: ${box.width}x${box.height}`]);
    
    scannerRef.current = new Html5Qrcode("qr-reader");
     

   scannerRef.current
      .start(cameraId,
        { fps: 10,qrbox: { width: size, height: size }, 
          
        },
        onScanSuccess,
        (err) => setLogs(l => [...l, `❌ start() error: ${err}`])
      )
      .catch((error) => {
        console.error("Scanner start failed:", error);
        setError(error);
      });

      return () => { void teardown(); };
   
}


// Loading camera data
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          // pick the back camera if you can, otherwise first
          const backCamera = devices.find(dev =>/back|rear|environment/i.test(dev.label));
          if(backCamera) setCameraId((backCamera || devices[0]).id);
        } 
        else {
          setError("No camera detected on this device.");
        }
      })
      .catch(() => {
        setError("Could not list camera devices.");
      });
  }, []);
  
  
  useEffect(() => {
     scanHandler()
  }, [cameraId,validate]); // 

  if (error) {
    return <p className="text-red-600 p-4">{error}</p>;
  }

  return <div className="flex flex-col items-center justify-center  bg-gray-100">
      <div  id="qr-reader" className="rounded-xl overflow-hidden w-[90svw] max-w-[640px] aspect-square"  />
           <div className="mt-4 p-2 bg-gray-100 h-32 overflow-auto">
         <p>Decoded token:{session?.sid}</p>  
        <strong>Logs:</strong>
        {logs.map((msg, i) => <div key={i}>{msg}</div>)}
        
      </div>
        </div>;
};

export default QrScanner;
