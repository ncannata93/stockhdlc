-- Script para identificar y corregir el problema de fechas de 8 días en lugar de 7

-- 1. Verificar el problema específico del 12-19 de mayo
SELECT 
    'PROBLEMA IDENTIFICADO' as status,
    assignment_date,
    EXTRACT(DOW FROM assignment_date::date) as dia_semana_num,
    CASE 
        WHEN EXTRACT(DOW FROM assignment_date::date) = 1 THEN 'Lunes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 2 THEN 'Martes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 3 THEN 'Miércoles'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 4 THEN 'Jueves'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 5 THEN 'Viernes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 6 THEN 'Sábado'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 0 THEN 'Domingo'
    END as dia_semana_nombre,
    COUNT(*) as asignaciones,
    SUM(daily_rate_used) as total_monto
FROM employee_assignments
WHERE assignment_date BETWEEN '2025-05-12' AND '2025-05-19'
GROUP BY assignment_date, EXTRACT(DOW FROM assignment_date::date)
ORDER BY assignment_date;

-- 2. Mostrar claramente qué fechas pertenecen a cada semana
SELECT 
    'SEMANA 12-18 MAYO (CORRECTA)' as semana,
    assignment_date,
    CASE 
        WHEN EXTRACT(DOW FROM assignment_date::date) = 1 THEN 'Lunes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 2 THEN 'Martes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 3 THEN 'Miércoles'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 4 THEN 'Jueves'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 5 THEN 'Viernes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 6 THEN 'Sábado'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 0 THEN 'Domingo'
    END as dia_semana,
    COUNT(*) as asignaciones
FROM employee_assignments
WHERE assignment_date BETWEEN '2025-05-12' AND '2025-05-18'
GROUP BY assignment_date, EXTRACT(DOW FROM assignment_date::date)
ORDER BY assignment_date

UNION ALL

SELECT 
    'SEMANA 19-25 MAYO (SIGUIENTE)' as semana,
    assignment_date,
    CASE 
        WHEN EXTRACT(DOW FROM assignment_date::date) = 1 THEN 'Lunes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 2 THEN 'Martes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 3 THEN 'Miércoles'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 4 THEN 'Jueves'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 5 THEN 'Viernes'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 6 THEN 'Sábado'
        WHEN EXTRACT(DOW FROM assignment_date::date) = 0 THEN 'Domingo'
    END as dia_semana,
    COUNT(*) as asignaciones
FROM employee_assignments
WHERE assignment_date BETWEEN '2025-05-19' AND '2025-05-25'
GROUP BY assignment_date, EXTRACT(DOW FROM assignment_date::date)
ORDER BY assignment_date;

-- 3. Verificar todas las semanas desde mayo para encontrar el patrón
WITH semanas AS (
    SELECT 
        assignment_date,
        -- Calcular el lunes de la semana para cada fecha
        assignment_date - INTERVAL '1 day' * (EXTRACT(DOW FROM assignment_date::date) - 1) as lunes_semana,
        EXTRACT(DOW FROM assignment_date::date) as dia_semana
    FROM employee_assignments
    WHERE assignment_date >= '2025-05-01'
)
SELECT 
    lunes_semana as inicio_semana,
    lunes_semana + INTERVAL '6 days' as fin_semana_correcto,
    COUNT(*) as total_asignaciones,
    STRING_AGG(DISTINCT assignment_date::text, ', ' ORDER BY assignment_date::text) as fechas_encontradas
FROM semanas
GROUP BY lunes_semana
ORDER BY lunes_semana;

-- 4. Mostrar el resumen por empleado para la semana problemática
SELECT 
    e.name as empleado,
    ea.assignment_date,
    CASE 
        WHEN ea.assignment_date BETWEEN '2025-05-12' AND '2025-05-18' THEN 'SEMANA CORRECTA'
        WHEN ea.assignment_date = '2025-05-19' THEN 'FECHA PROBLEMÁTICA (debe ir a siguiente semana)'
        ELSE 'OTRA SEMANA'
    END as clasificacion,
    ea.hotel_name,
    ea.daily_rate_used
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date BETWEEN '2025-05-12' AND '2025-05-19'
ORDER BY e.name, ea.assignment_date;
