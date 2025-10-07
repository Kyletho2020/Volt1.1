/*
  # Create temporary quote storage table

  1. New Tables
    - `temp_quote_data`
      - `id` (uuid, primary key)
      - `session_id` (text, unique identifier for browser session)
      - `equipment_data` (jsonb, stores equipment quote form data)
      - `logistics_data` (jsonb, stores logistics quote form data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `temp_quote_data` table
    - Add policy for public access (temporary data, no auth required)
    - Add automatic cleanup for old records (older than 24 hours)
*/

CREATE TABLE IF NOT EXISTS temp_quote_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  equipment_data jsonb DEFAULT '{}'::jsonb,
  logistics_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE temp_quote_data ENABLE ROW LEVEL SECURITY;

-- Allow public access for temporary data
CREATE POLICY "Allow public access to temp quote data"
  ON temp_quote_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_temp_quote_data_session_id 
  ON temp_quote_data(session_id);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_temp_quote_data_created_at 
  ON temp_quote_data(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_temp_quote_data_updated_at ON temp_quote_data;
CREATE TRIGGER update_temp_quote_data_updated_at
  BEFORE UPDATE ON temp_quote_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_temp_data()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_quote_data 
  WHERE created_at < now() - interval '24 hours';
END;
$$ language 'plpgsql';