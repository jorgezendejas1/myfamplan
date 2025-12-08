-- Add unique constraint on email for google_accounts table
ALTER TABLE public.google_accounts ADD CONSTRAINT google_accounts_email_unique UNIQUE (email);