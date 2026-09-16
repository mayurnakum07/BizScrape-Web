"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        description="Dialog foundation for confirmations and short forms."
      >
        <p className="text-small">
          This uses the native{" "}
          <code className="text-code text-foreground">&lt;dialog&gt;</code>{" "}
          element with focus management and Escape-to-close.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setOpen(false)}>Continue</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
