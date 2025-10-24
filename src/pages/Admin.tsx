import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const Admin = () => {
  const [formData, setFormData] = useState({
    ticketCode: "",
    attendeeName: "",
    eventName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if ticket code already exists
      const { data: existing } = await supabase
        .from("attendees")
        .select("ticket_code")
        .eq("ticket_code", formData.ticketCode)
        .single();

      if (existing) {
        toast.error("Ticket code already exists in database");
        setIsSubmitting(false);
        return;
      }

      // Add new attendee
      const { error } = await supabase.from("attendees").insert({
        ticket_code: formData.ticketCode,
        attendee_name: formData.attendeeName,
        event_name: formData.eventName,
      });

      if (error) throw error;

      toast.success(`Successfully registered ${formData.attendeeName} for ${formData.eventName}`);
      
      // Reset form
      setFormData({
        ticketCode: "",
        attendeeName: "",
        eventName: "",
      });
    } catch (error) {
      console.error("Error adding attendee:", error);
      toast.error("Failed to register attendee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <div className="space-x-4">
            <Button variant="secondary" onClick={() => navigate("/")}>
              Scanner
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              On-Spot Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticketCode">Ticket Code *</Label>
                <Input
                  id="ticketCode"
                  placeholder="Enter unique ticket code"
                  value={formData.ticketCode}
                  onChange={(e) =>
                    setFormData({ ...formData, ticketCode: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This should be a unique identifier for the ticket
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeeName">Attendee Name *</Label>
                <Input
                  id="attendeeName"
                  placeholder="Enter attendee full name"
                  value={formData.attendeeName}
                  onChange={(e) =>
                    setFormData({ ...formData, attendeeName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Illuminate, Finbiz, or other event"
                  value={formData.eventName}
                  onChange={(e) =>
                    setFormData({ ...formData, eventName: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Event-specific colors will be shown during check-in
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Attendee"}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Event Color Guide:</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-illuminate"></span>
                  <span>Illuminate - Blue</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-finbiz"></span>
                  <span>Finbiz - Yellow</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-success"></span>
                  <span>Other Events - Green</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
