-- Identificar empleados duplicados por nombre
SELECT 
    name,
    COUNT(*) as cantidad,
    STRING_AGG(CAST(id AS TEXT), ', ') as ids,
    STRING_AGG(CAST(daily_rate AS TEXT), ', ') as tarifas
FROM employees 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Ver detalles de Tucu específicamente
SELECT * FROM employees WHERE name = 'Tucu' ORDER BY id;

-- Verificar asignaciones de cada Tucu
SELECT 
    ea.employee_id,
    e.name,
    e.daily_rate,
    COUNT(ea.id) as total_asignaciones,
    MIN(ea.assignment_date) as primera_asignacion,
    MAX(ea.assignment_date) as ultima_asignacion
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE e.name = 'Tucu'
GROUP BY ea.employee_id, e.name, e.daily_rate
ORDER BY ea.employee_id;

-- OPCIONAL: Si quieres consolidar los Tucu duplicados
-- (EJECUTAR SOLO DESPUÉS DE REVISAR LOS DATOS)
/*
-- Actualizar todas las asignaciones del Tucu con tarifa $15,000 
-- para que apunten al Tucu con tarifa $40,000
UPDATE employee_assignments 
SET employee_id = (SELECT id FROM employees WHERE name = 'Tucu' AND daily_rate = 40000 LIMIT 1)
WHERE employee_id = (SELECT id FROM employees WHERE name = 'Tucu' AND daily_rate = 15000 LIMIT 1);

-- Eliminar el empleado duplicado
DELETE FROM employees 
WHERE name = 'Tucu' AND daily_rate = 15000;
*/
