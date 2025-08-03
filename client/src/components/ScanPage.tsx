import { useQR } from "./context/QrContext"
import QrScanner from "./QRScanner";

export default function ScanPage() {
  const expectedToken = useQR();
  
  

  

  return <QrScanner expectedToken={expectedToken} />;
}
