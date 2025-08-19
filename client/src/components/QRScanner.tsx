// src/components/QrScanner.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQR } from "./context/QrContext";
import { Html5Qrcode} from "html5-qrcode";


const QrScanner = () => {

  const {validate,token,validated}=useQR()
  const navigate=useNavigate()
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraId, setCameraId] = useState<string|null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);


  //Guards from re-rendering
 const scannerRef = useRef<Html5Qrcode | null>(null);
  const started = useRef(false);
  const gotResult = useRef(false);
  const inFlight = useRef(false);
  const lastText = useRef<string>("");
  const lastAt = useRef(0);

  

//  async function checkQrScanability(qrElementId: string): Promise<number> {
//   // 1. Find the QR element and its rendered width in CSS‑px
//   const qrEl = document.getElementById(qrElementId);
//   if (!qrEl){ 
    
//     setLogs(l => [...l, `Element "#${qrElementId}" not found.`]);
//     throw new Error(`Element "#${qrElementId}" not found.`)
    
  
//   };
//   const { width: qrDomWidth } = qrEl.getBoundingClientRect();

//   // 2. Grab one frame from the camera to read its true resolution
//   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//   const track  = stream.getVideoTracks()[0];
//   const settings = track.getSettings();
//   // Stop the camera immediately once we have settings
//   track.stop();

//   if (!settings.width || !settings.height) {
    
//     setLogs(l => [...l, `Could not determine camera capture resolution.`]);
//     throw new Error("Could not determine camera capture resolution.");
//   }

//   // 3. Figure out how many camera pixels correspond to one CSS‑px on screen
//   //    (we assume the video is rendered full‑width to the same CSS width as qrEl)
//   const cameraResWidth = settings.width;
//   // NOTE: you might want to measure the actual <video> element size instead,
//   // but for a quick check we assume full‑width
//   const videoCssWidth = qrDomWidth;  

//   const pxRatio = cameraResWidth / videoCssWidth;

//   // 4. A standard “Version 1” QR code is 21×21 modules
//   const moduleSizePx = (qrDomWidth / 21) * pxRatio;

//   return moduleSizePx;
// }

const onScanSuccess = async (decoded: string) => {
      // debounce identical frames for 1.5s
      const now = Date.now();
      if (decoded === lastText.current && now - lastAt.current < 1500) return;
      lastText.current = decoded;
      lastAt.current = now;

      if (gotResult.current || inFlight.current) return;
      inFlight.current = true;

      // extract token if you encoded a URL
      let token = decoded;
     
      const url = new URL(decoded);
      token = url.searchParams.get("token") || decoded;
      

      const ok = await validate(token);
      inFlight.current = false;

      if (ok) {
        gotResult.current = true;
        // stop once, await so we don’t race further callbacks
            alert("✅ Login successful!");
            alert(`Response from server : ${ok} Decoded: ${token}`)
            // setLogs(l => [...l, `✅ Response from server : ${validated} Decoded: ${token}`]);
            // navigate("/chat")
        teardown()
      }
    };

const teardown = async () => {
    let closed = false;
    if (closed) 
      return;
    
    closed = true;
    try { await scannerRef.current?.stop(); } catch {}
    try { scannerRef.current?.clear(); } catch {}
};


 async function scanHandler(){
    if (!cameraId) return;
    

    if (started.current) return;         // avoid StrictMode double init
    started.current = true;
    
    scannerRef.current = new Html5Qrcode("qr-reader");

   scannerRef.current
      .start(cameraId,
        { fps: 10,qrbox: { width: 250, height: 250 }, },
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
      <div  id="qr-reader" className="w-full max-w-xs" />
           <div className="mt-4 p-2 bg-gray-100 h-32 overflow-auto">
            <p>ExpectedData: {token}</p>
        <strong>Logs:</strong>
        {logs.map((msg, i) => <div key={i}>{msg}</div>)}
        
      </div>
        </div>;
};



export default QrScanner;
