-- Verificar pagos con problemas
SELECT 
  ep.*,
  e.name as employee_name,
  CASE 
    WHEN ep.week_start IS NULL THEN 'Falta week_start'
    WHEN ep.week_end IS NULL THEN 'Falta week_end'
    WHEN ep.amount IS NULL OR ep.amount = 0 THEN 'Falta amount'
    WHEN ep.employee_id IS NULL THEN 'Falta employee_id'
    ELSE 'OK'
  END as status_check
FROM employee_payments ep
LEFT JOIN employees e ON ep.employee_id = e.id
WHERE ep.week_start IS NULL 
   OR ep.week_end IS NULL 
   OR ep.amount IS NULL 
   OR ep.amount = 0
   OR ep.employee_id IS NULL
ORDER BY ep.created_at DESC;

-- Corregir pagos con fechas faltantes
UPDATE employee_payments 
SET 
  week_start = payment_date - INTERVAL '6 days',
  week_end = payment_date
WHERE week_start IS NULL OR week_end IS NULL;

-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_payments'
ORDER BY ordinal_position;
