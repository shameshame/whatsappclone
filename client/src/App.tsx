import {BrowserRouter,Routes,Route, useSearchParams} from "react-router"

import ChatList from "./components/ChatList"
import SideBar from './components/SideBar'
import ChatWindow from './components/ChatWindow'
import Login from "./components/Login";
import QrScanner from "./components/QRScanner";
import { QrProvider } from "./components/context/QrContext";
import QRGenerator from "./components/QRGenerator";
import ScanPage from "./components/ScanPage";

function WithQr({ children }: { children: React.ReactNode }) {
  const [params] = useSearchParams();
  const token    = params.get("token")!;
  return <QrProvider token={token}>{children}</QrProvider>;
}





function App() {
  return (
    <div className="flex  w-full h-screen bg-[#F5F5DC]">
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
       
          <Route path="/scan" element={<WithQr><ScanPage /></WithQr>} />
          <Route path="/qr" element={<WithQr><QRGenerator /></WithQr>} />
       
      </Routes>
    </BrowserRouter>
    

    </div>
  );
}

export default App;
