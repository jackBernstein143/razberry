-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories table  
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  audio_url TEXT,
  prompt TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (clerk_user_id = current_setting('app.current_user_id')::text);

CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (current_setting('app.current_role')::text = 'service_role');

-- Create RLS policies for stories
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_user_id')::text
    )
  );

CREATE POLICY "Users can view public stories" ON stories
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_user_id')::text
    )
  );

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_user_id')::text
    )
  );

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_setting('app.current_user_id')::text
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();