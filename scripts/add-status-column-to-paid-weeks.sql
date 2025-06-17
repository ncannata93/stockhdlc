-- Agregar columna status a la tabla paid_weeks
ALTER TABLE paid_weeks 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pagado';

-- Actualizar registros existentes para que tengan status 'pagado'
UPDATE paid_weeks 
SET status = 'pagado' 
WHERE status IS NULL;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_paid_weeks_status ON paid_weeks(status);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'paid_weeks' 
ORDER BY ordinal_position;
