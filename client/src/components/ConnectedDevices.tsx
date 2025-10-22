// src/components/ConnectedDevices.tsx

import { Link, useNavigate } from "react-router";
import {RefreshCw, LogOut, QrCode} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { httpErrorFromResponse, toAppError } from "@/utilities/error-utils";
import { Fragment, useEffect, useState } from "react";
import { Device,DevicesResponse } from "@/types/device";
import { LinkedDeviceRow } from "./LinkedDeviceRow";
import { SkeletonLine } from "./SkeletonLine";



export function ConnectedDevices() {
  // const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(()=>{

    try{
     setLogs(l => [...l, `Idiotka starushich v palto`])
    }catch(error){
     setLogs(l => [...l, `❌ start() error: ${error}`])
    }
  },[])
  
  
  
  return <div className="w-full h-full m-auto">
     <Button asChild>
          <Link to="/scan">
            <QrCode className="mr-2 h-4 w-4" />
            Link a device
          </Link>
        </Button>
        {logs.map((msg, i) => <div key={i}><h1>{msg}</h1></div>)}
  </div>
}

