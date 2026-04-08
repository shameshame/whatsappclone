import {BrowserRouter,Routes,Route, Outlet} from "react-router"
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
import { ChatListProvider } from "./components/context/ChatListContext";
import SettingsPage from "./components/settings/Settings";
import Account  from "./components/Account";
import Security from "./components/Security";







function App() {
  return (
    <div className="flex  w-full h-screen bg-[#F5F5DC]">
     <BrowserRouter>
      
        <AuthProvider>
           <ChatListProvider>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/phone" element={<Outlet />}>
              <Route path="register" element={<CreateAccount/>} />
              <Route path="login" element={<LoginPasskey/>} />
              <Route element={<Protected/>}>
                <Route path="devices" element={<ConnectedDevices />} />
                <Route path="chats" element={<ChatList />} />
                
                <Route path="settings" element={<Outlet />}>
                  <Route index element={<SettingsPage />} />
                  <Route path="security" element={<Security/>} />
                  <Route path="account" element={<Account/>} />
                </Route>
              </Route>
            </Route>
            <Route path="/scan" element={<QrProvider> <ScanPage/> </QrProvider>} />
            <Route path="/qr" element={<QrProvider><QRGenerator/></QrProvider>} />
            <Route path="/chat" element={<ChatPage/>} />
            <Route path="/chat/:chatId" element={<ChatWindow/>}/>
           
          </Routes>
          </ChatListProvider>
        </AuthProvider>
       
      </BrowserRouter>
    

    </div>
  );
}

export default App;
