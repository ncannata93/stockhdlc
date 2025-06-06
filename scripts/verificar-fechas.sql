-- Verificar las fechas almacenadas en la base de datos
SELECT 
  id,
  employee_id,
  hotel_name,
  assignment_date,
  daily_rate_used,
  created_at,
  -- Mostrar el día de la semana para verificar
  EXTRACT(DOW FROM assignment_date) as day_of_week,
  TO_CHAR(assignment_date, 'Day DD/MM/YYYY') as formatted_date
FROM employee_assignments 
ORDER BY assignment_date DESC, employee_id
LIMIT 20;

-- Verificar si hay problemas con las fechas
SELECT 
  assignment_date,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM employee_assignments 
GROUP BY assignment_date 
ORDER BY assignment_date DESC
LIMIT 10;
