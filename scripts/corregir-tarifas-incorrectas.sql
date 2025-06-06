-- Primero, veamos las asignaciones problemáticas del 3/6
SELECT 
    e.name as empleado,
    e.daily_rate as tarifa_correcta,
    ea.hotel_name,
    ea.daily_rate_used as tarifa_incorrecta,
    ea.assignment_date,
    ea.id as assignment_id
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date = '2025-01-03'
  AND ea.daily_rate_used != (e.daily_rate / 
    (SELECT COUNT(*) 
     FROM employee_assignments ea2 
     WHERE ea2.employee_id = ea.employee_id 
       AND ea2.assignment_date = ea.assignment_date))
ORDER BY e.name, ea.hotel_name;

-- Corregir las tarifas para las asignaciones del 3/6
-- Para Tucu (asumiendo que su tarifa diaria es 40000 y trabajó en 2 hoteles)
UPDATE employee_assignments 
SET daily_rate_used = (
    SELECT e.daily_rate / COUNT(ea2.id)
    FROM employees e, employee_assignments ea2
    WHERE e.id = employee_assignments.employee_id
      AND ea2.employee_id = employee_assignments.employee_id
      AND ea2.assignment_date = employee_assignments.assignment_date
)
WHERE assignment_date = '2025-01-03'
  AND employee_id IN (
    SELECT id FROM employees WHERE name ILIKE '%tucu%'
  );

-- Verificar que la corrección funcionó
SELECT 
    e.name as empleado,
    e.daily_rate as tarifa_empleado,
    ea.hotel_name,
    ea.daily_rate_used as tarifa_corregida,
    ea.assignment_date
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date = '2025-01-03'
  AND e.name ILIKE '%tucu%'
ORDER BY ea.hotel_name;
