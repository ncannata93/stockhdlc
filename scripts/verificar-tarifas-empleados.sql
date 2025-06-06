-- Verificar las tarifas de los empleados y sus asignaciones
SELECT 
    e.id,
    e.name,
    e.daily_rate as tarifa_empleado,
    ea.hotel_name,
    ea.assignment_date,
    ea.daily_rate_used as tarifa_usada_en_asignacion,
    ea.created_at
FROM employees e
LEFT JOIN employee_assignments ea ON e.id = ea.employee_id
WHERE e.name ILIKE '%tucu%'
ORDER BY ea.assignment_date DESC, ea.created_at DESC;

-- Ver todas las asignaciones del 3/6
SELECT 
    e.name as empleado,
    e.daily_rate as tarifa_empleado,
    ea.hotel_name,
    ea.assignment_date,
    ea.daily_rate_used as tarifa_usada,
    ea.created_at
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date = '2025-01-03'
ORDER BY ea.created_at DESC;
