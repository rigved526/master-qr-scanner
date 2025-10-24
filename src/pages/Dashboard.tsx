import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Clock, CheckCircle } from "lucide-react";

interface CheckIn {
  id: string;
  ticket_code: string;
  attendee_name: string;
  event_name: string;
  checked_in_at: string;
}

const Dashboard = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    illuminate: 0,
    finbiz: 0,
    other: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckIns();

    // Set up realtime subscription
    const channel = supabase
      .channel("check_ins_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
        },
        (payload) => {
          const newCheckIn = payload.new as CheckIn;
          setCheckIns((prev) => [newCheckIn, ...prev]);
          updateStats([newCheckIn, ...checkIns]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCheckIns = async () => {
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .order("checked_in_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setCheckIns(data);
      updateStats(data);
    }
  };

  const updateStats = (data: CheckIn[]) => {
    const illuminate = data.filter((c) =>
      c.event_name.toLowerCase().includes("illuminate")
    ).length;
    const finbiz = data.filter((c) =>
      c.event_name.toLowerCase().includes("finbiz")
    ).length;
    const other = data.length - illuminate - finbiz;

    setStats({
      total: data.length,
      illuminate,
      finbiz,
      other,
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventBadgeColor = (eventName: string) => {
    const eventLower = eventName.toLowerCase();
    if (eventLower.includes("illuminate")) return "bg-illuminate text-illuminate-foreground";
    if (eventLower.includes("finbiz")) return "bg-finbiz text-finbiz-foreground";
    return "bg-success text-success-foreground";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Master Control Dashboard</h1>
          <div className="space-x-4">
            <Button onClick={() => navigate("/")}>
              Scanner
            </Button>
            <Button variant="secondary" onClick={() => navigate("/admin")}>
              Admin Panel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Illuminate</CardTitle>
              <CheckCircle className="h-4 w-4 text-illuminate" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.illuminate}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Finbiz</CardTitle>
              <CheckCircle className="h-4 w-4 text-finbiz" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.finbiz}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Other Events</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.other}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Check-ins (Live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkIns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No check-ins yet. Start scanning tickets!
                </p>
              ) : (
                checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-success" />
                      <div>
                        <p className="font-semibold">{checkIn.attendee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ticket: {checkIn.ticket_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEventBadgeColor(checkIn.event_name)}`}>
                        {checkIn.event_name}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTime(checkIn.checked_in_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
