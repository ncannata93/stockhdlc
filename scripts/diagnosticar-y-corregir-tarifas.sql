-- PASO 1: Diagnosticar el problema actual
SELECT 
    'DIAGNÓSTICO ACTUAL' as tipo,
    e.name as empleado,
    ea.assignment_date as fecha,
    ea.hotel_name as hotel,
    ea.daily_rate_used as tarifa_usada,
    e.daily_rate as tarifa_empleado,
    COUNT(*) OVER (PARTITION BY ea.employee_id, ea.assignment_date) as hoteles_mismo_dia
FROM employee_assignments ea
JOIN employees e ON e.id = ea.employee_id
WHERE ea.assignment_date >= '2025-04-01'
ORDER BY e.name, ea.assignment_date, ea.hotel_name;

-- PASO 2: Mostrar casos problemáticos
SELECT 
    'CASOS PROBLEMÁTICOS' as tipo,
    e.name as empleado,
    ea.assignment_date as fecha,
    COUNT(*) as num_hoteles,
    ea.daily_rate_used as tarifa_por_hotel,
    SUM(ea.daily_rate_used) as total_cobrado,
    MAX(e.daily_rate) as tarifa_correcta,
    CASE 
        WHEN SUM(ea.daily_rate_used) > MAX(e.daily_rate) THEN 'SOBRECOBRO'
        WHEN SUM(ea.daily_rate_used) < MAX(e.daily_rate) THEN 'SUBCOBRO'
        ELSE 'CORRECTO'
    END as estado
FROM employee_assignments ea
JOIN employees e ON e.id = ea.employee_id
WHERE ea.assignment_date >= '2025-04-01'
GROUP BY e.name, ea.assignment_date, ea.daily_rate_used
HAVING COUNT(*) > 1 OR SUM(ea.daily_rate_used) != MAX(e.daily_rate)
ORDER BY e.name, ea.assignment_date;

-- PASO 3: Corregir las tarifas incorrectas
WITH assignments_to_fix AS (
    SELECT 
        ea.id,
        ea.employee_id,
        ea.assignment_date,
        ea.hotel_name,
        ea.daily_rate_used as current_rate,
        e.daily_rate as employee_rate,
        COUNT(*) OVER (PARTITION BY ea.employee_id, ea.assignment_date) as hotels_same_day,
        ROUND(e.daily_rate::numeric / COUNT(*) OVER (PARTITION BY ea.employee_id, ea.assignment_date), 0) as correct_rate
    FROM employee_assignments ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.assignment_date >= '2025-04-01'
)
UPDATE employee_assignments 
SET daily_rate_used = (
    SELECT correct_rate 
    FROM assignments_to_fix 
    WHERE assignments_to_fix.id = employee_assignments.id
),
notes = COALESCE(notes, '') || ' [Tarifa corregida automáticamente]'
WHERE id IN (
    SELECT id 
    FROM assignments_to_fix 
    WHERE current_rate != correct_rate
);

-- PASO 4: Verificar la corrección
SELECT 
    'DESPUÉS DE CORRECCIÓN' as tipo,
    e.name as empleado,
    ea.assignment_date as fecha,
    COUNT(*) as num_hoteles,
    ea.daily_rate_used as tarifa_por_hotel,
    SUM(ea.daily_rate_used) as total_dia,
    MAX(e.daily_rate) as tarifa_empleado,
    CASE 
        WHEN ABS(SUM(ea.daily_rate_used) - MAX(e.daily_rate)) <= 1 THEN 'CORRECTO'
        ELSE 'AÚN INCORRECTO'
    END as estado
FROM employee_assignments ea
JOIN employees e ON e.id = ea.employee_id
WHERE ea.assignment_date >= '2025-04-01'
GROUP BY e.name, ea.assignment_date, ea.daily_rate_used
ORDER BY e.name, ea.assignment_date;
