import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Scanner = () => {
  const [scanResult, setScanResult] = useState<{
    status: "success" | "error" | "already-checked" | null;
    message: string;
    event: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isScanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        setIsScanning(false);
        scanner.clear();
        
        // Look up ticket in database
        const { data: attendee, error: attendeeError } = await supabase
          .from("attendees")
          .select("*")
          .eq("ticket_code", decodedText)
          .single();

        if (attendeeError || !attendee) {
          setScanResult({
            status: "error",
            message: "Not registered. Please recheck entry or register on spot.",
            event: "",
          });
          return;
        }

        // Check if already checked in
        const { data: existingCheckIn } = await supabase
          .from("check_ins")
          .select("*")
          .eq("ticket_code", decodedText)
          .single();

        if (existingCheckIn) {
          setScanResult({
            status: "already-checked",
            message: `Already checked in for ${existingCheckIn.event_name}`,
            event: existingCheckIn.event_name,
          });
          return;
        }

        // Record check-in
        const { error: checkInError } = await supabase
          .from("check_ins")
          .insert({
            ticket_code: attendee.ticket_code,
            attendee_name: attendee.attendee_name,
            event_name: attendee.event_name,
          });

        if (checkInError) {
          setScanResult({
            status: "error",
            message: "Error recording check-in. Please try again.",
            event: "",
          });
          return;
        }

        setScanResult({
          status: "success",
          message: `Verified - ${attendee.attendee_name}`,
          event: attendee.event_name,
        });
      },
      (error) => {
        console.error("Scan error:", error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning]);

  const getBackgroundColor = () => {
    if (!scanResult) return "bg-background";
    
    if (scanResult.status === "error") return "bg-error";
    if (scanResult.status === "already-checked") return "bg-alreadyChecked";
    
    // Event-specific colors for success
    const eventLower = scanResult.event.toLowerCase();
    if (eventLower.includes("illuminate")) return "bg-illuminate";
    if (eventLower.includes("finbiz")) return "bg-finbiz";
    return "bg-success";
  };

  const getIcon = () => {
    if (!scanResult) return null;
    
    if (scanResult.status === "error") 
      return <XCircle className="w-24 h-24 text-error-foreground" />;
    if (scanResult.status === "already-checked") 
      return <AlertCircle className="w-24 h-24 text-alreadyChecked-foreground" />;
    return <CheckCircle2 className="w-24 h-24 text-success-foreground" />;
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${getBackgroundColor()}`}>
      <div className="w-full max-w-4xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Check-In Scanner</h1>
          <div className="space-x-4">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate("/admin")}>
              Admin Panel
            </Button>
          </div>
        </div>

        {isScanning && !scanResult && (
          <div className="bg-card rounded-lg p-6 shadow-xl">
            <div id="qr-reader" className="w-full"></div>
            <p className="text-center mt-4 text-muted-foreground">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}

        {scanResult && (
          <div className="flex flex-col items-center justify-center space-y-8 py-12">
            {getIcon()}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">
                {scanResult.status === "success" ? "VERIFIED" : 
                 scanResult.status === "already-checked" ? "ALREADY CHECKED IN" : "NOT REGISTERED"}
              </h2>
              <p className="text-2xl text-white">{scanResult.message}</p>
              {scanResult.event && (
                <p className="text-xl text-white opacity-90">Event: {scanResult.event}</p>
              )}
            </div>
            <Button 
              size="lg" 
              onClick={resetScanner}
              className="mt-8"
            >
              Scan Next Attendee
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
