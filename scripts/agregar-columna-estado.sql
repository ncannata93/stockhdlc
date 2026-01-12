-- Agregar columna 'estado' a la tabla prestamos
-- Esta columna es necesaria para rastrear el estado de cada préstamo

ALTER TABLE prestamos 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

-- Agregar constraint para validar valores permitidos
ALTER TABLE prestamos 
ADD CONSTRAINT prestamos_estado_check 
CHECK (estado IN ('pendiente', 'pagado', 'cancelado'));

-- Actualizar registros existentes que no tengan estado
UPDATE prestamos 
SET estado = 'pendiente' 
WHERE estado IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'prestamos' 
AND column_name = 'estado';

-- Mostrar resumen
SELECT 
  COUNT(*) as total_prestamos,
  COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
  COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados
FROM prestamos;
