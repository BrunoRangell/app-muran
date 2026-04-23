INSERT INTO public.report_templates (name, is_global, sections, client_id)
VALUES (
  'DashCortex (Premium)',
  true,
  '{"premiumLayout": "dashcortex"}'::jsonb,
  NULL
)
ON CONFLICT DO NOTHING;