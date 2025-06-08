-- Script para eliminar asignaciones que están fuera del rango de semanas válidas
-- Esto corregirá el problema del 19/05 apareciendo en la semana del 12/05-18/05

-- Primero, veamos qué asignaciones problemáticas tenemos
SELECT 
    assignment_date,
    COUNT(*) as cantidad,
    STRING_AGG(DISTINCT hotel_name, ', ') as hoteles,
    STRING_AGG(DISTINCT e.name, ', ') as empleados
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE assignment_date = '2025-05-19'
GROUP BY assignment_date
ORDER BY assignment_date;

-- Verificar si el 19/05/2025 es lunes (inicio de nueva semana)
-- Si es lunes, entonces NO debería aparecer en la semana anterior (12/05-18/05)

-- Mostrar el contexto de fechas alrededor del problema
SELECT 
    assignment_date,
    EXTRACT(DOW FROM assignment_date::date) as dia_semana,
    CASE 
        WHEN EXTRACT(DOW FROM assignment_date::date) = 1 THEN 'Lunes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 2 THEN 'Martes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 3 THEN 'Miércoles'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 4 THEN 'Jueves'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 5 THEN 'Viernes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 6 THEN 'Sábado'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 0 THEN 'Domingo'
    END as nombre_dia,
    COUNT(*) as asignaciones
FROM employee_assignments
WHERE assignment_date BETWEEN '2025-05-12' AND '2025-05-20'
GROUP BY assignment_date, EXTRACT(DOW FROM assignment_date::date)
ORDER BY assignment_date;

-- Si el problema persiste, podemos verificar la estructura de la consulta
-- Mostrar todas las asignaciones de mayo para entender el patrón
SELECT 
    assignment_date,
    COUNT(*) as total_asignaciones,
    SUM(daily_rate_used) as total_monto
FROM employee_assignments
WHERE assignment_date LIKE '2025-05%'
GROUP BY assignment_date
ORDER BY assignment_date;

-- Verificar si hay duplicados o datos inconsistentes
SELECT 
    employee_id,
    assignment_date,
    hotel_name,
    daily_rate_used,
    COUNT(*) as duplicados
FROM employee_assignments
WHERE assignment_date BETWEEN '2025-05-12' AND '2025-05-19'
GROUP BY employee_id, assignment_date, hotel_name, daily_rate_used
HAVING COUNT(*) > 1;

-- Mostrar información detallada para debugging
SELECT 
    ea.id,
    ea.assignment_date,
    e.name as empleado,
    ea.hotel_name,
    ea.daily_rate_used,
    ea.created_at
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE assignment_date BETWEEN '2025-05-12' AND '2025-05-19'
ORDER BY assignment_date, e.name, ea.hotel_name;
