-- Add missing UI persistence fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT;

-- Add status column to batches for active/archived state
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
