-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table to store connected Google accounts
CREATE TABLE public.google_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    calendar_id TEXT DEFAULT 'primary',
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table to map local events to Google Calendar events
CREATE TABLE public.event_sync_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_event_id TEXT NOT NULL,
    google_event_id TEXT NOT NULL,
    google_account_id UUID REFERENCES public.google_accounts(id) ON DELETE CASCADE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sync_status TEXT DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(local_event_id, google_account_id)
);

-- Create table to store sync queue for pending changes
CREATE TABLE public.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_account_id UUID REFERENCES public.google_accounts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    local_event_id TEXT NOT NULL,
    event_data JSONB,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sync_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Permissive policies for local-first app
CREATE POLICY "Allow all operations on google_accounts" 
ON public.google_accounts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on event_sync_mapping" 
ON public.event_sync_mapping FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sync_queue" 
ON public.sync_queue FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_event_sync_local_id ON public.event_sync_mapping(local_event_id);
CREATE INDEX idx_event_sync_google_id ON public.event_sync_mapping(google_event_id);
CREATE INDEX idx_sync_queue_account ON public.sync_queue(google_account_id);

-- Update trigger
CREATE TRIGGER update_google_accounts_updated_at
BEFORE UPDATE ON public.google_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();