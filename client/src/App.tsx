import {BrowserRouter,Routes,Route} from "react-router"
import ChatWindow from './components/ChatWindow'
import { QrProvider } from "./components/context/QrContext";
import QRGenerator from "./components/QRGenerator";
import ScanPage from "./components/ScanPage";
import CreateAccount from "./components/CreateAccount"
import { AuthProvider } from "./components/context/AuthContext";
import LoginPasskey from "./components/LoginPassKey";
import Home from "./components/Home";
import Protected from "./components/Protected";
import { ConnectedDevices } from "./components/ConnectedDevices";
import ChatPage from "./components/ChatPage";
import ChatList from "./components/ChatList";







function App() {
  return (
    <div className="flex  w-full h-screen bg-[#F5F5DC]">
     <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/register" element={<CreateAccount/>} />
            <Route path="/phone/login" element={<LoginPasskey/>} />
            <Route path="/phone/devices" element={<ConnectedDevices/>}/>
            <Route path="/phone/chats" element={<Protected><ChatList/></Protected>} />
            <Route path="/scan" element={<Protected><QrProvider> <ScanPage/> </QrProvider></Protected>} />
            <Route path="/qr" element={<QrProvider><QRGenerator/></QrProvider>} />
            <Route path="/chat" element={<Protected><ChatPage/></Protected>} />
            <Route path="/chat/:chatId" element={<Protected><ChatWindow/></Protected>}/>
           
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    

    </div>
  );
}

export default App;
