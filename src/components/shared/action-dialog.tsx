"use client";

// Shell comun pentru modalele new / edit / delete tag și „grupează” conversație.
// Conținutul (input, select, mesaj) vine prin children; butoanele prin actions.
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export type ActionDialogAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  disabled?: boolean;
};

type ActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  error?: string | null;
  actions: ActionDialogAction[];
};

export function ActionDialog({ open, onOpenChange, title, description, children, error, actions }: ActionDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <div className="space-y-3">{children}</div> : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          {actions.map(action => (
            <Button
              disabled={action.disabled}
              key={action.label}
              onClick={action.onClick}
              type="button"
              variant={action.variant ?? "default"}
            >
              {action.label}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
