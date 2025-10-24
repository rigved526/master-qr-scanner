import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Scan, LayoutDashboard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ status: 'valid' | 'invalid' | 'duplicate', message: string, eventName?: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        () => {} // onScanFailure - silent
      );
      
      setScanning(true);
      setResult(null);
    } catch (err) {
      toast.error("Failed to start camera");
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    
    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_code', decodedText)
      .maybeSingle();

    if (ticketError) {
      setResult({ status: 'invalid', message: 'Error checking ticket' });
      toast.error("Error checking ticket");
      return;
    }

    if (!ticket) {
      setResult({ status: 'invalid', message: 'Not registered. Please recheck entry or register on spot.' });
      toast.error("Invalid ticket");
      return;
    }

    // Check if already checked in
    if (ticket.checked_in_at) {
      setResult({ status: 'duplicate', message: `Already checked in for ${ticket.event_name}`, eventName: ticket.event_name });
      toast.error("Ticket already used");
      return;
    }

    // Valid check-in - update ticket
    const { error: checkInError } = await supabase
      .from('tickets')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id);

    if (checkInError) {
      setResult({ status: 'invalid', message: 'Error recording check-in' });
      toast.error("Error recording check-in");
      return;
    }

    setResult({ status: 'valid', message: `Verified - ${ticket.attendee_name}`, eventName: ticket.event_name });
    toast.success(`Checked in: ${ticket.attendee_name}`);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const getBackgroundColor = () => {
    if (!result) return "bg-gradient-to-br from-background via-background to-primary/5";
    
    if (result.status === "invalid") return "bg-error";
    if (result.status === "duplicate") return "bg-alreadyChecked";
    
    // Event-specific colors for valid check-ins
    const eventLower = result.eventName?.toLowerCase() || "";
    if (eventLower.includes("illuminate")) return "bg-illuminate";
    if (eventLower.includes("finbiz")) return "bg-finbiz";
    return "bg-success";
  };

  return (
    <div className={`min-h-screen p-4 transition-colors duration-500 ${getBackgroundColor()}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Event Scanner</h1>
            <p className="text-muted-foreground">Scan barcode or QR code</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </div>

        {/* Scanner Card */}
        {!result && (
          <Card className="p-6 space-y-4">
            <div id="reader" className="w-full rounded-lg overflow-hidden" />
            
            {!scanning && (
              <Button
                onClick={startScanner}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Scan className="w-5 h-5" />
                Start Scanning
              </Button>
            )}

            {scanning && (
              <Button
                onClick={stopScanner}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Stop Scanning
              </Button>
            )}
          </Card>
        )}

        {/* Result Display */}
        {result && (
          <Card className={`p-8 text-center space-y-4 transition-all duration-500 ${
            result.status === 'valid' 
              ? 'bg-transparent border-white/20' 
              : 'bg-transparent border-white/20'
          }`}>
            {result.status === 'valid' && (
              <>
                <CheckCircle className="w-20 h-20 mx-auto text-white animate-in zoom-in duration-500" />
                <h2 className="text-2xl font-bold text-white">VERIFIED</h2>
              </>
            )}
            {result.status === 'invalid' && (
              <>
                <XCircle className="w-20 h-20 mx-auto text-white animate-in zoom-in duration-500" />
                <h2 className="text-2xl font-bold text-white">NOT REGISTERED</h2>
              </>
            )}
            {result.status === 'duplicate' && (
              <>
                <AlertCircle className="w-20 h-20 mx-auto text-white animate-in zoom-in duration-500" />
                <h2 className="text-2xl font-bold text-white">ALREADY CHECKED IN</h2>
              </>
            )}
            <p className="text-lg text-white">{result.message}</p>
            {result.eventName && (
              <p className="text-md text-white/80">Event: {result.eventName}</p>
            )}
            
            <Button
              onClick={() => {
                setResult(null);
                startScanner();
              }}
              className="mt-4 gap-2 bg-white text-primary hover:bg-white/90"
            >
              <Scan className="w-4 h-4" />
              Scan Next Attendee
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Scanner;
