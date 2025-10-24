import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, Plus } from "lucide-react";

const Admin = () => {
  const [ticketCode, setTicketCode] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [eventName, setEventName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("tickets").insert({
      ticket_code: ticketCode,
      attendee_name: attendeeName,
      event_name: eventName,
    });

    if (error) {
      toast.error("Failed to register attendee");
    } else {
      toast.success("Attendee registered successfully!");
      setTicketCode("");
      setAttendeeName("");
      setEventName("");
    }

    setIsLoading(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header row
      
      const tickets = rows
        .filter(row => row.trim()) // Filter empty rows
        .map(row => {
          const [ticket_code, attendee_name, event_name] = row.split(',').map(cell => cell.trim());
          return { ticket_code, attendee_name, event_name };
        })
        .filter(ticket => ticket.ticket_code && ticket.attendee_name && ticket.event_name);

      if (tickets.length === 0) {
        toast.error("No valid data found in CSV");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("tickets").insert(tickets);

      if (error) {
        toast.error("Failed to import CSV data");
        console.error(error);
      } else {
        toast.success(`Successfully imported ${tickets.length} attendees!`);
      }

      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <div className="space-x-4">
            <Button onClick={() => navigate("/")}>Scanner</Button>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>

        {/* CSV Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import via CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: ticket_code, attendee_name, event_name
            </p>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Single Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Register Single Attendee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticketCode">Ticket Code</Label>
                <Input
                  id="ticketCode"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Enter ticket code"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeeName">Attendee Name</Label>
                <Input
                  id="attendeeName"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Enter attendee name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Illuminate, Finbiz"
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                {isLoading ? "Registering..." : "Register Attendee"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
