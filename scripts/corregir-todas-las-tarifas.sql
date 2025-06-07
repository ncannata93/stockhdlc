-- Corregir TODAS las tarifas duplicadas de empleados que trabajaron en múltiples hoteles el mismo día

-- Primero, veamos el problema actual
SELECT 
  e.name as empleado,
  ea.assignment_date as fecha,
  COUNT(*) as hoteles_count,
  ea.daily_rate_used as tarifa_por_hotel,
  SUM(ea.daily_rate_used) as total_dia_actual,
  MAX(ea.daily_rate_used) as tarifa_correcta_total
FROM employee_assignments ea
JOIN employees e ON e.id = ea.employee_id
GROUP BY e.name, ea.assignment_date, ea.daily_rate_used
HAVING COUNT(*) > 1
ORDER BY ea.assignment_date DESC;

-- Ahora corregimos las tarifas
UPDATE employee_assignments 
SET daily_rate_used = daily_rate_used / (
  SELECT COUNT(*)
  FROM employee_assignments ea2 
  WHERE ea2.employee_id = employee_assignments.employee_id 
  AND ea2.assignment_date = employee_assignments.assignment_date
)
WHERE employee_id IN (
  SELECT employee_id
  FROM employee_assignments
  GROUP BY employee_id, assignment_date
  HAVING COUNT(*) > 1
);

-- Verificar que se corrigió
SELECT 
  e.name as empleado,
  ea.assignment_date as fecha,
  COUNT(*) as hoteles_count,
  ea.daily_rate_used as tarifa_por_hotel,
  SUM(ea.daily_rate_used) as total_dia_corregido
FROM employee_assignments ea
JOIN employees e ON e.id = ea.employee_id
GROUP BY e.name, ea.assignment_date, ea.daily_rate_used
HAVING COUNT(*) > 1
ORDER BY ea.assignment_date DESC;
