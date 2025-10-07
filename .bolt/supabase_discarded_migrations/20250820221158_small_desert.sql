/*
  # Create quotes table for storing quote data

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `session_id` (text, for session tracking)
      - `quote_number` (text, unique quote identifier)
      - `customer_name` (text, customer contact name)
      - `company_name` (text, company name)
      - `email` (text, contact email)
      - `phone` (text, contact phone)
      - `site_address` (text, project/site address)
      - `pickup_address` (text, pickup location)
      - `pickup_city` (text, pickup city)
      - `pickup_state` (text, pickup state)
      - `pickup_zip` (text, pickup zip code)
      - `form_snapshot` (jsonb, complete form data snapshot)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `quotes` table
    - Add policy for public access (since this is a quote generation tool)

  3. Indexes
    - Index on session_id for efficient session-based queries
    - Index on quote_number for unique quote lookups
    - Index on created_at for chronological sorting
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  quote_number text UNIQUE NOT NULL,
  customer_name text,
  company_name text,
  email text,
  phone text,
  site_address text,
  pickup_address text,
  pickup_city text,
  pickup_state text,
  pickup_zip text,
  form_snapshot jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Allow public access to quotes" ON quotes;
CREATE POLICY "Allow public access to quotes"
  ON quotes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON quotes (session_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes (quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_name ON quotes (customer_name);
CREATE INDEX IF NOT EXISTS idx_quotes_company_name ON quotes (company_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_quotes_updated_at'
  ) THEN
    CREATE TRIGGER update_quotes_updated_at
      BEFORE UPDATE ON quotes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;