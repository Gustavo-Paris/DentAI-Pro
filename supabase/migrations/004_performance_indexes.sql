-- Performance indexes for common queries
-- These indexes significantly improve RLS performance and query speed

-- Enable trigram extension first (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================
-- PATIENTS TABLE
-- ===========================================

-- Critical for RLS policy (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_patients_user_id
  ON public.patients(user_id);

-- For sorting patient lists by creation date
CREATE INDEX IF NOT EXISTS idx_patients_created_at
  ON public.patients(created_at DESC);

-- For patient name search/autocomplete
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm
  ON public.patients USING gin(name gin_trgm_ops);

-- ===========================================
-- EVALUATIONS TABLE
-- ===========================================

-- Critical for RLS policy (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id
  ON public.evaluations(user_id);

-- For joining with patients table
CREATE INDEX IF NOT EXISTS idx_evaluations_patient_id
  ON public.evaluations(patient_id)
  WHERE patient_id IS NOT NULL;

-- For sorting evaluation lists
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at
  ON public.evaluations(created_at DESC);

-- Composite index for common dashboard query (user's recent evaluations)
CREATE INDEX IF NOT EXISTS idx_evaluations_user_created
  ON public.evaluations(user_id, created_at DESC);

-- For filtering by treatment type
CREATE INDEX IF NOT EXISTS idx_evaluations_treatment_type
  ON public.evaluations(treatment_type)
  WHERE treatment_type IS NOT NULL;

-- ===========================================
-- USER_INVENTORY TABLE
-- ===========================================

-- Critical for RLS policy (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id
  ON public.user_inventory(user_id);

-- For joining with resin_catalog
CREATE INDEX IF NOT EXISTS idx_user_inventory_resin_id
  ON public.user_inventory(resin_id);

-- ===========================================
-- RESIN_CATALOG TABLE
-- ===========================================

-- For filtering by brand
CREATE INDEX IF NOT EXISTS idx_resin_catalog_brand
  ON public.resin_catalog(brand);

-- For filtering by product line
CREATE INDEX IF NOT EXISTS idx_resin_catalog_product_line
  ON public.resin_catalog(product_line);

-- Composite for inventory lookups
CREATE INDEX IF NOT EXISTS idx_resin_catalog_brand_product
  ON public.resin_catalog(brand, product_line);

-- ===========================================
-- EVALUATION_DRAFTS TABLE
-- ===========================================

-- Critical for RLS policy
CREATE INDEX IF NOT EXISTS idx_evaluation_drafts_user_id
  ON public.evaluation_drafts(user_id);

-- ===========================================
-- RATE_LIMITS TABLE (already has indexes from 003)
-- ===========================================
-- idx_rate_limits_user_function already exists
-- idx_rate_limits_updated_at already exists

-- ===========================================
-- ANALYZE TABLES
-- ===========================================
-- Update table statistics for query planner

ANALYZE public.patients;
ANALYZE public.evaluations;
ANALYZE public.user_inventory;
ANALYZE public.resin_catalog;
ANALYZE public.evaluation_drafts;
ANALYZE public.rate_limits;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON INDEX idx_patients_user_id IS 'Improves RLS performance for patients table';
COMMENT ON INDEX idx_evaluations_user_id IS 'Improves RLS performance for evaluations table';
COMMENT ON INDEX idx_evaluations_user_created IS 'Optimizes dashboard query for recent evaluations';
COMMENT ON INDEX idx_user_inventory_user_id IS 'Improves RLS performance for inventory table';
