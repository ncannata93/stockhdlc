-- Crear tabla para historial de mantenimientos
CREATE TABLE IF NOT EXISTS maintenance_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at timestamp with time zone DEFAULT now(),
  execution_type text NOT NULL, -- 'full', 'averages', 'payments'
  services_updated integer DEFAULT 0,
  payments_generated integer DEFAULT 0,
  errors integer DEFAULT 0,
  config jsonb DEFAULT '{}', -- Configuracion usada (meses, dia vencimiento, etc)
  log_summary text,
  executed_by text
);

-- Habilitar RLS
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;

-- Politica para permitir todas las operaciones
CREATE POLICY "Allow all operations on maintenance_history" ON maintenance_history
  FOR ALL USING (true) WITH CHECK (true);

-- Indice para busquedas por fecha
CREATE INDEX IF NOT EXISTS idx_maintenance_history_executed_at ON maintenance_history(executed_at DESC);
