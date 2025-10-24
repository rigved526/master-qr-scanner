import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, QrCode, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Ticket {
  id: string;
  ticket_code: string;
  attendee_name: string;
  event_name: string;
  checked_in_at: string | null;
}

const Dashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    pending: 0,
  });

  useEffect(() => {
    loadTickets();
    subscribeToTickets();
  }, []);

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("checked_in_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error loading tickets:", error);
      return;
    }

    if (data) {
      setTickets(data);
      updateStats(data);
    }
  };

  const updateStats = (ticketData: Ticket[]) => {
    const total = ticketData.length;
    const checkedIn = ticketData.filter((t) => t.checked_in_at !== null).length;
    const pending = total - checkedIn;
    setStats({ total, checkedIn, pending });
  };

  const subscribeToTickets = () => {
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">
            Master Control Panel
          </h1>
          <div className="flex gap-2">
            <Link to="/admin">
              <Button variant="outline">Admin Panel</Button>
            </Link>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <QrCode className="h-5 w-5" />
                Open Scanner
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                <p className="text-3xl font-bold text-success">{stats.checkedIn}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              All Attendees
            </h2>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tickets yet. Add attendees via the Admin Panel.
                </p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-lg border transition-all ${
                      ticket.checked_in_at
                        ? "bg-success/5 border-success/20"
                        : "bg-muted/5 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {ticket.checked_in_at ? (
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        ) : (
                          <XCircle className="h-6 w-6 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {ticket.attendee_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.event_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-muted-foreground">
                          {ticket.ticket_code}
                        </p>
                        {ticket.checked_in_at && (
                          <p className="text-xs text-success">
                            {new Date(ticket.checked_in_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
