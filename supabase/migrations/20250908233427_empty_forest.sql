/*
  # Add equipment_requirements column to quotes table

  1. Changes
    - Add `equipment_requirements` column to `quotes` table
    - Column type: JSONB to store structured equipment data
    - Default value: empty JSON object

  2. Purpose
    - Fixes database schema mismatch error
    - Allows saving equipment requirements data with quotes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'equipment_requirements'
  ) THEN
    ALTER TABLE quotes ADD COLUMN equipment_requirements JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;