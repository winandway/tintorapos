import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RegistroServiceWorker } from "@/components/app/registro-sw";
import { ProveedorTostadas } from "@/components/ui/aviso";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <ProveedorTostadas>
      <RegistroServiceWorker />
      {children}
    </ProveedorTostadas>
  );
}
