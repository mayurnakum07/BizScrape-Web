"use client";

import type { ReactNode } from "react";
import { ToastContainer, toast, type TypeOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type AppToastOptions = {
  description?: string;
};

function emit(type: TypeOptions, title: string, options?: AppToastOptions) {
  const content = options?.description ? (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="text-xs text-[var(--muted)]">{options.description}</p>
    </div>
  ) : (
    <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
  );

  toast(content, { type });
}

/** App toast helpers — M0-styled via ToastifyProvider. */
export const appToast = {
  success(title: string, options?: AppToastOptions) {
    emit("success", title, options);
  },
  error(title: string, options?: AppToastOptions) {
    emit("error", title, options);
  },
  info(title: string, options?: AppToastOptions) {
    emit("info", title, options);
  },
  warning(title: string, options?: AppToastOptions) {
    emit("warning", title, options);
  },
};

export function ToastifyProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable={false}
        theme="dark"
        limit={4}
      />
    </>
  );
}
