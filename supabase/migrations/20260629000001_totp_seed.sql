-- Add TOTP Seed storage to profiles (encrypted)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS totp_seed TEXT;
