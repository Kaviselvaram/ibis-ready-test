-- Week 1: Foundation
-- 1. Database Schema + FK Indexes
-- 2. RLS Policies (deny-by-default strictly enforced)
-- 3. Sealed answers table

-- Create missing performance indexes for high-load queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_profile ON public.test_attempts(profile_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_topic ON public.test_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_media_topic ON public.media(topic_id);
CREATE INDEX IF NOT EXISTS idx_youtubes_topic ON public.youtubes(topic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_batch ON public.profiles(batch_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON public.chapters(order_index);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON public.topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON public.topics(order_index);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- Update questions with metadata for the test engine
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS bloom_level TEXT DEFAULT 'Understand',
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'MCQ',
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Admin Upload';

-- 3. Sealed Answers Table
-- This table is purely for the backend service_role to grade tests.
CREATE TABLE IF NOT EXISTS public.sealed_answers (
    question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    correct_option_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deny-by-default RLS for sealed_answers
ALTER TABLE public.sealed_answers ENABLE ROW LEVEL SECURITY;
-- No policies created. Only service_role can access.

-- Migrate existing answers to sealed_answers (if any exist)
INSERT INTO public.sealed_answers (question_id, correct_option_id)
SELECT id, correct_answer FROM public.questions
WHERE correct_answer IS NOT NULL
ON CONFLICT (question_id) DO NOTHING;

-- Drop correct_answer from questions so it can never be accidentally leaked by a SELECT *
ALTER TABLE public.questions DROP COLUMN IF EXISTS correct_answer;

-- Ensure RLS is strictly enabled on all tables (Defense in Depth)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Webhook Idempotency table (for Week 4 Payments)
CREATE TABLE IF NOT EXISTS public.processed_events (
    event_id TEXT PRIMARY KEY,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;
-- No policies. Service role only.

-- Payment History Table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
-- Users can see their own payment history
CREATE POLICY "Users can view own payment history" 
    ON public.payment_history FOR SELECT 
    USING (auth.uid() = user_id);
