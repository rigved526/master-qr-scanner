-- Create attendees table to store ticket information
CREATE TABLE public.attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  attendee_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check_ins table to track when tickets are scanned
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL,
  attendee_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_ticket FOREIGN KEY (ticket_code) REFERENCES public.attendees(ticket_code) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for scanning)
CREATE POLICY "Allow public read access to attendees"
ON public.attendees
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to check_ins"
ON public.check_ins
FOR SELECT
USING (true);

-- Create policies for public insert (for check-ins and admin on-spot registrations)
CREATE POLICY "Allow public insert to attendees"
ON public.attendees
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to check_ins"
ON public.check_ins
FOR INSERT
WITH CHECK (true);

-- Enable realtime for check_ins table so dashboard updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;

-- Create index for faster ticket lookups
CREATE INDEX idx_attendees_ticket_code ON public.attendees(ticket_code);
CREATE INDEX idx_check_ins_ticket_code ON public.check_ins(ticket_code);
CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins(checked_in_at DESC);