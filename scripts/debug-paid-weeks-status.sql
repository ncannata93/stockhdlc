-- Verificar el estado actual de las semanas pagadas
SELECT 
  pw.employee_id,
  e.name as employee_name,
  pw.week_start,
  pw.week_end,
  pw.amount,
  pw.paid_date,
  pw.notes
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
ORDER BY pw.employee_id, pw.week_start DESC;

-- Verificar si hay duplicados
SELECT 
  employee_id,
  week_start,
  week_end,
  COUNT(*) as count
FROM paid_weeks
GROUP BY employee_id, week_start, week_end
HAVING COUNT(*) > 1;

-- Mostrar estadísticas generales
SELECT 
  COUNT(*) as total_paid_weeks,
  COUNT(DISTINCT employee_id) as employees_with_payments,
  MIN(week_start) as earliest_week,
  MAX(week_end) as latest_week
FROM paid_weeks;
