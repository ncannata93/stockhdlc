-- Script para verificar y corregir posibles problemas en la base de datos

-- 1. Verificar estructura de tablas
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name IN ('employees', 'employee_assignments', 'employee_payments')
ORDER BY 
  table_name, ordinal_position;

-- 2. Verificar empleados sin tarifa diaria
SELECT 
  id, 
  name, 
  role, 
  daily_rate
FROM 
  employees
WHERE 
  daily_rate IS NULL OR daily_rate = 0;

-- 3. Verificar asignaciones sin tarifa diaria
SELECT 
  ea.id, 
  e.name as employee_name, 
  ea.hotel_name, 
  ea.assignment_date, 
  ea.daily_rate_used
FROM 
  employee_assignments ea
JOIN 
  employees e ON ea.employee_id = e.id
WHERE 
  ea.daily_rate_used IS NULL OR ea.daily_rate_used = 0;

-- 4. Corregir asignaciones sin tarifa diaria (usando la tarifa actual del empleado)
UPDATE 
  employee_assignments ea
SET 
  daily_rate_used = e.daily_rate
FROM 
  employees e
WHERE 
  ea.employee_id = e.id
  AND (ea.daily_rate_used IS NULL OR ea.daily_rate_used = 0)
  AND e.daily_rate > 0;

-- 5. Verificar pagos sin monto
SELECT 
  ep.id, 
  e.name as employee_name, 
  ep.payment_date, 
  ep.amount, 
  ep.status
FROM 
  employee_payments ep
JOIN 
  employees e ON ep.employee_id = e.id
WHERE 
  ep.amount IS NULL OR ep.amount = 0;

-- 6. Verificar integridad referencial
SELECT 
  'employee_assignments' as tabla,
  COUNT(*) as registros_huerfanos
FROM 
  employee_assignments ea
LEFT JOIN 
  employees e ON ea.employee_id = e.id
WHERE 
  e.id IS NULL
UNION ALL
SELECT 
  'employee_payments' as tabla,
  COUNT(*) as registros_huerfanos
FROM 
  employee_payments ep
LEFT JOIN 
  employees e ON ep.employee_id = e.id
WHERE 
  e.id IS NULL;

-- 7. Eliminar registros huérfanos (opcional, comentado por seguridad)
-- DELETE FROM employee_assignments WHERE employee_id NOT IN (SELECT id FROM employees);
-- DELETE FROM employee_payments WHERE employee_id NOT IN (SELECT id FROM employees);

-- 8. Verificar duplicados en asignaciones (mismo empleado, hotel y fecha)
SELECT 
  employee_id, 
  hotel_name, 
  assignment_date, 
  COUNT(*) as duplicados
FROM 
  employee_assignments
GROUP BY 
  employee_id, hotel_name, assignment_date
HAVING 
  COUNT(*) > 1;

-- 9. Verificar estado final después de correcciones
SELECT 
  'employees' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE daily_rate > 0) as con_tarifa,
  COUNT(*) FILTER (WHERE daily_rate IS NULL OR daily_rate = 0) as sin_tarifa
FROM 
  employees
UNION ALL
SELECT 
  'employee_assignments' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE daily_rate_used > 0) as con_tarifa,
  COUNT(*) FILTER (WHERE daily_rate_used IS NULL OR daily_rate_used = 0) as sin_tarifa
FROM 
  employee_assignments
UNION ALL
SELECT 
  'employee_payments' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE amount > 0) as con_monto,
  COUNT(*) FILTER (WHERE amount IS NULL OR amount = 0) as sin_monto
FROM 
  employee_payments;
