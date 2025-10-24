-- Create new tickets table with all necessary fields
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  attendee_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to tickets" 
ON public.tickets 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to tickets" 
ON public.tickets 
FOR UPDATE 
USING (true);

-- Migrate existing data from attendees table
INSERT INTO public.tickets (ticket_code, attendee_name, event_name, created_at)
SELECT ticket_code, attendee_name, event_name, created_at
FROM public.attendees
ON CONFLICT (ticket_code) DO NOTHING;

-- Update checked_in_at for tickets that have been checked in
UPDATE public.tickets t
SET checked_in_at = ci.checked_in_at
FROM public.check_ins ci
WHERE t.ticket_code = ci.ticket_code;

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Drop old tables (keeping data safe in tickets table)
DROP TABLE IF EXISTS public.check_ins;
DROP TABLE IF EXISTS public.attendees;