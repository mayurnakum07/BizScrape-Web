"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirms use the error-styled primary action. */
  tone?: "default" | "destructive";
  loading?: boolean;
  children?: ReactNode;
};

/**
 * App-styled confirmation dialog - replaces window.confirm / alert.
 * Unmounted when closed so closed dialogs never paint over the page.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  children,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={e => {
          // Equivalent to disableBackdropClose
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full">
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === "destructive" ? "destructive" : "primary"}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
