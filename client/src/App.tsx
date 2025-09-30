import {BrowserRouter,Routes,Route} from "react-router"
import ChatWindow from './components/ChatWindow'
import Login from "./components/Login";
import { QrProvider } from "./components/context/QrContext";
import QRGenerator from "./components/QRGenerator";
import ScanPage from "./components/ScanPage";
import CreateAccount from "./components/CreateAccount"
import { AuthProvider } from "./components/context/AuthContext";







function App() {
  return (
    <div className="flex  w-full h-screen bg-[#F5F5DC]">
     <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<CreateAccount/>} />
            <Route path="/scan" element={<QrProvider><ScanPage/></QrProvider>} />
            <Route path="/qr" element={<QrProvider><QRGenerator/></QrProvider>} />
            <Route path="/chat" element={<ChatWindow/>}/>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    

    </div>
  );
}

export default App;
