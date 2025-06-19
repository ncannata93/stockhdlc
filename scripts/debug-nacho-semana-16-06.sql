-- 🔍 DIAGNÓSTICO ESPECÍFICO: Nacho semana 16/06/2025
SELECT 
  'EMPLEADO' as tipo,
  id,
  name,
  daily_rate
FROM employees 
WHERE name = 'Nacho'

UNION ALL

SELECT 
  'ASIGNACIONES_SEMANA_16_06' as tipo,
  id::text,
  assignment_date || ' - ' || hotel_name,
  daily_rate_used::text
FROM employee_assignments 
WHERE employee_id = 5 
  AND assignment_date >= '2025-06-16' 
  AND assignment_date <= '2025-06-22'
ORDER BY assignment_date

UNION ALL

SELECT 
  'PAGOS_SEMANA_16_06' as tipo,
  id::text,
  week_start || ' al ' || week_end,
  amount::text || ' (PAGADO: ' || CASE WHEN amount::numeric > 0 THEN 'SÍ' ELSE 'NO' END || ')'
FROM paid_weeks 
WHERE employee_id = 5 
  AND (
    (week_start <= '2025-06-16' AND week_end >= '2025-06-16') OR
    (week_start <= '2025-06-22' AND week_end >= '2025-06-22') OR
    (week_start >= '2025-06-16' AND week_end <= '2025-06-22')
  )
ORDER BY week_start;
