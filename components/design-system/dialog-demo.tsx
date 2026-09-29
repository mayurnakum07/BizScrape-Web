"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";

export function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Confirm action"
        description="Dialog foundation for confirmations and short forms."
      >
        <p className="text-small">
          This uses the native{" "}
          <code className="text-code text-foreground">&lt;dialog&gt;</code>{" "}
          element with focus management and Escape-to-close.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export function DrawerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        description="Side panel for secondary controls."
      >
        <p className="text-small">
          Drawer overlays use the elevated surface, sharp edges, and the modal
          z-index layer.
        </p>
        <div className="mt-4">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </Drawer>
    </div>
  );
}
