// src/components/ConnectedDevices.tsx

import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Device | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    
    try {
        const res = await fetch("/api/devices", { credentials: "include" });
        
        if (!res.ok) throw await httpErrorFromResponse(res);
        
        const data = (await res.json()) as DevicesResponse;
        setDevices(data.devices ?? []);
    }catch (error: unknown) {
           setError(toAppError(error).message);
    }finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function removeDevice(id: string) {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw await httpErrorFromResponse(res);
      setDevices((prev) => prev?.filter((d) => d.id !== id));
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to sign out device");
    } finally {
      setConfirmOpen(false);
      setToRemove(null);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Linked devices</CardTitle>
          <CardDescription>Devices currently logged into your account.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate("/qr")}>
            <QrCode className="mr-2 h-4 w-4" />
            Link a device
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && 
          <div className="space-y-3">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
        }
        <Button onClick={() => navigate("/scan")}>Link a device</Button>
        {devices?.map((d, i) => (
              <Fragment key={d.id}>
                <LinkedDeviceRow
                  device={d}
                  onSignOut={() => {
                    setToRemove(d);
                    setConfirmOpen(true);
                  }}
                />
                {i < devices.length - 1 ? <Separator className="my-2" /> : null}
              </Fragment>
            ))}
      </CardContent>

      {/* Confirm sign-out dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out device</DialogTitle>
            <DialogDescription>
              {toRemove?.name ?? toRemove?.id} will be signed out and will no longer receive messages until it’s linked again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => toRemove && removeDevice(toRemove.id)}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

