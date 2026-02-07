-- Migration: Add DSD simulation layers support
-- Adds JSONB column for multi-layer DSD simulations (restorations-only, whitening-restorations, complete-treatment)

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS dsd_simulation_layers JSONB DEFAULT NULL;

-- Backfill: wrap existing single simulation_url into layers array format
-- Only for rows that have a simulation_url but no layers yet
UPDATE evaluations
SET dsd_simulation_layers = jsonb_build_array(
  jsonb_build_object(
    'type', 'whitening-restorations',
    'label', 'Tratamento Completo',
    'simulation_url', dsd_simulation_url,
    'whitening_level', COALESCE(
      (dsd_analysis->>'whitening_level'),
      'natural'
    ),
    'includes_gengivoplasty', false
  )
)
WHERE dsd_simulation_url IS NOT NULL
  AND dsd_simulation_layers IS NULL;

COMMENT ON COLUMN evaluations.dsd_simulation_layers IS 'Array of simulation layers: [{type, label, simulation_url, whitening_level, includes_gengivoplasty}]';
