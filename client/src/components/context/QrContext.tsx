// src/QrContext.tsx
import React, { createContext, useContext } from "react";

const QrContext = createContext<string | null>(null);
export const useQR = () => {
  const token = useContext(QrContext);
  if (token === null) {
    throw new Error("useToken must be inside a TokenProvider");
  }
  return token;
};

export function QrProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  return (
    <QrContext.Provider value={token}>
      {children}
    </QrContext.Provider>
  );
}
