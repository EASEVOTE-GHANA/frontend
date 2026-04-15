"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Maximize2,
} from "lucide-react";
import { clsx } from "clsx";

type ScanResult = {
  status: "success" | "error" | "warning";
  title: string;
  message: string;
  details?: {
    holder: string;
    type: string;
    checkedInAt?: string;
  };
};

export default function TicketScannerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const eventId = params.id as string;
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [scanning, setScanning] = useState(true); // Auto-start scanning (or show UI to start)
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    // Initialize Scanner
    // We use a timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    try {
      if (document.getElementById("reader")) {
        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          /* verbose= */ false,
        );
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            handleScan(decodedText);
          },
          (errorMessage) => {
            // ignore scan errors, they happen every frame
          },
        );
      }
    } catch (err) {
      console.error("Scanner init error:", err);
      setCameraError(
        "Failed to initialize camera. Please explicitly allow camera access.",
      );
    }
  };

  const handleScan = async (code: string) => {
    if (processing) return;

    // Pause scanner visual?
    if (scannerRef.current) {
      scannerRef.current.pause();
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/proxy/tickets/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // @ts-ignore - accessToken exists on custom session
          ...(session?.accessToken && {
            Authorization: `Bearer ${session.accessToken}`,
          }),
        },
        body: JSON.stringify({ ticketNumber: code }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          status: "success",
          title: "Valid Ticket",
          message: "Check-in successful",
          details: {
            holder: data.ticket.holder,
            type: data.ticket.type,
          },
        });
      } else if (response.status === 409) {
        const date = new Date(data.checkedInAt).toLocaleTimeString();
        setResult({
          status: "warning",
          title: "Already Used",
          message: `Checked in at ${date}`,
          details: {
            holder: data.holder,
            type: data.ticketType,
          },
        });
      } else {
        setResult({
          status: "error",
          title: "Invalid Ticket",
          message: data.error || "Unknown error",
        });
      }
    } catch (error) {
      setResult({
        status: "error",
        title: "Error",
        message: "Network or server error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode("");
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-lg">Scan Tickets</h1>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-6">
        {/* Result Overlay / Display */}
        {result ? (
          <div
            className={clsx(
              "rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300",
              result.status === "success" && "bg-green-600",
              result.status === "warning" && "bg-amber-500 text-slate-900",
              result.status === "error" && "bg-red-600",
            )}
          >
            <div className="flex justify-center mb-4">
              {result.status === "success" && (
                <CheckCircle className="h-16 w-16" />
              )}
              {result.status === "warning" && (
                <AlertTriangle className="h-16 w-16" />
              )}
              {result.status === "error" && <XCircle className="h-16 w-16" />}
            </div>

            <h2 className="text-2xl font-bold mb-2">{result.title}</h2>
            <p className="opacity-90 mb-4">{result.message}</p>

            {result.details && (
              <div className="bg-white/20 rounded-lg p-4 text-left">
                <div className="text-sm opacity-75">Holder</div>
                <div className="font-semibold text-lg">
                  {result.details.holder}
                </div>
                <div className="mt-2 text-sm opacity-75">Ticket Type</div>
                <div className="font-semibold">{result.details.type}</div>
              </div>
            )}

            <button
              onClick={resetScanner}
              className="mt-6 w-full bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Scan Next
            </button>
          </div>
        ) : (
          <>
            {/* Camera Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square border-2 border-slate-700">
              <div id="reader" className="w-full h-full"></div>
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <p className="text-red-400">{cameraError}</p>
                </div>
              )}
            </div>

            <p className="text-center text-slate-400 text-sm">
              Point camera at QR code
            </p>

            {/* Manual Entry */}
            <div className="mt-auto">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-500">
                    Or type code
                  </span>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter Ticket Code"
                  className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!manualCode || processing}
                  className="bg-primary-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
