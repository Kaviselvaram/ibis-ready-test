-- Phase 1: Database Audit Updates
-- Adding missing tables and relations for the Ibis Physics Portal

-- 1. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    school TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view batches" 
    ON public.batches FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 2. Update Profiles (Admin Role & Batch Relation)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- 3. Topics Table (Course Hierarchy)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view topics" 
    ON public.topics FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 4. Re-link Media, Youtubes, and Questions to Topics (instead of Chapters)
-- Since data is fresh, we drop the old column and add the new correct foreign key.
ALTER TABLE public.media 
DROP COLUMN IF EXISTS chapter_id,
ADD COLUMN topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE;

ALTER TABLE public.youtubes 
DROP COLUMN IF EXISTS chapter_id,
ADD COLUMN topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE;

ALTER TABLE public.questions 
DROP COLUMN IF EXISTS chapter_id,
ADD COLUMN topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE;

-- 5. Test Attempts Table (Student Progress & Scoring)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
-- Students can only see their own scores.
CREATE POLICY "Users can view own test attempts" 
    ON public.test_attempts FOR SELECT 
    USING (auth.uid() = profile_id);

-- 6. Audit Log (For Admin Tracking)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- No client policies for audit_log. Only service_role can read/write this.
