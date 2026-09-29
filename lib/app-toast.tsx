"use client";

import type { ReactNode } from "react";
import { Toaster, toast } from "sonner";

type AppToastOptions = {
  description?: string;
};

export const appToast = {
  success(title: string, options?: AppToastOptions) {
    toast.success(title, { description: options?.description });
  },
  error(title: string, options?: AppToastOptions) {
    toast.error(title, { description: options?.description });
  },
  info(title: string, options?: AppToastOptions) {
    toast.info(title, { description: options?.description });
  },
  warning(title: string, options?: AppToastOptions) {
    toast.warning(title, { description: options?.description });
  },
};

export function ToastifyProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: "#080A09",
            border: "1px solid rgba(200, 240, 74, 0.2)",
            color: "#fff"
          }
        }}
      />
    </>
  );
}
