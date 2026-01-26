"use client";

import * as React from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const stopScanner = React.useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // Only stop if scanning (state 2) or paused (state 3)
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore errors during cleanup
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = React.useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onOpenChange(false);
        },
        () => {
          // Ignore scan failures (no barcode in frame)
        },
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start scanner";
      if (message.includes("Permission")) {
        setError("Camera permission denied. Please allow camera access.");
      } else if (message.includes("NotFound")) {
        setError("No camera found on this device.");
      } else {
        setError(message);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [onScan, onOpenChange, stopScanner]);

  // Start scanner when dialog opens
  React.useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(startScanner, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at a barcode to scan it.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
              <p className="text-sm text-muted-foreground">
                Starting camera...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div
            id="barcode-scanner-container"
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
