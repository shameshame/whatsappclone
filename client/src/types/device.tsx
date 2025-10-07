
export type DeviceInfo = { name: string; userAgent: string; timeZone: string; mobile?: boolean };


export type Device = DeviceInfo & {
  id: string;
  lastSeenISO?: string | null;     // ISO string
  current?: boolean;

}

export type  DevicesResponse = { devices: Device[] };