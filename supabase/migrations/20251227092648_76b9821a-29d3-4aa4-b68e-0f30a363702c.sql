-- Create mushroom profiles table
CREATE TABLE public.mushroom_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  is_default BOOLEAN NOT NULL DEFAULT false,
  humidity_min NUMERIC NOT NULL DEFAULT 70,
  humidity_max NUMERIC NOT NULL DEFAULT 90,
  temperature_min NUMERIC NOT NULL DEFAULT 20,
  temperature_max NUMERIC NOT NULL DEFAULT 28,
  fresh_air_interval INTEGER NOT NULL DEFAULT 30,
  fresh_air_duration INTEGER NOT NULL DEFAULT 5,
  fogger_max_on_time INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mushroom_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own profiles
CREATE POLICY "Users can view their own profiles"
ON public.mushroom_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
ON public.mushroom_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.mushroom_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
ON public.mushroom_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mushroom_profiles_updated_at
  BEFORE UPDATE ON public.mushroom_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_mushroom_profiles_user_id ON public.mushroom_profiles(user_id);
CREATE INDEX idx_mushroom_profiles_is_active ON public.mushroom_profiles(user_id, is_active) WHERE is_active = true;