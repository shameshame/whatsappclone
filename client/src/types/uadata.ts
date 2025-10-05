export type UADataLike = {
  brands?: { brand: string; version: string }[];
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
};


export type NavigatorWithUA = Navigator & {
  userAgentData?: UADataLike;
  msMaxTouchPoints?: number; // legacy IE/old Edge
};