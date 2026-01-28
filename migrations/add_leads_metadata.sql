-- Migration: Add metadata field to leads table
-- This field stores enriched data about the lead (UTM params, device info, email quality, etc)

-- Add metadata column (JSONB for flexible storage)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add email_quality column for quick filtering
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_quality VARCHAR(20);

-- Index for email quality filtering
CREATE INDEX IF NOT EXISTS idx_leads_email_quality ON leads(email_quality);

-- Comment explaining the metadata structure
COMMENT ON COLUMN leads.metadata IS 'JSON containing: utm (source, medium, campaign, term, content), email (type, quality, domain), device (device, browser, language, screen), referrer, timestamp, timezone, pageUrl';
COMMENT ON COLUMN leads.email_quality IS 'Email classification: corporate, personal, educational, disposable';
