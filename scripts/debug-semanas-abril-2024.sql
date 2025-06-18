-- 🔍 DIAGNÓSTICO ESPECÍFICO: Semanas de Abril 2024 (20/04 al 27/04)
-- Verificar qué está causando que las semanas aparezcan como pendientes

-- 1. VERIFICAR ASIGNACIONES EN ESA SEMANA
SELECT 
    'ASIGNACIONES EN SEMANA 20-27 ABRIL 2024' as tipo,
    ea.id,
    ea.employee_id,
    e.name as employee_name,
    ea.assignment_date,
    ea.hotel_name,
    ea.daily_rate_used,
    ea.created_at
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date >= '2024-04-20' 
  AND ea.assignment_date <= '2024-04-27'
ORDER BY ea.employee_id, ea.assignment_date;

-- 2. VERIFICAR SEMANAS PAGADAS QUE PODRÍAN SOLAPARSE
SELECT 
    'SEMANAS PAGADAS RELACIONADAS' as tipo,
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date,
    pw.notes,
    -- Verificar si hay solapamiento con 2024-04-20 a 2024-04-27
    CASE 
        WHEN pw.week_start <= '2024-04-27' AND pw.week_end >= '2024-04-20' 
        THEN 'SOLAPAMIENTO DETECTADO'
        ELSE 'SIN SOLAPAMIENTO'
    END as solapamiento_status
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE (
    -- Semanas que podrían solaparse con abril 20-27
    (pw.week_start <= '2024-04-27' AND pw.week_end >= '2024-04-20')
    OR 
    -- Semanas exactas
    (pw.week_start = '2024-04-20' AND pw.week_end = '2024-04-27')
    OR
    -- Semanas cercanas (para contexto)
    (pw.week_start >= '2024-04-13' AND pw.week_start <= '2024-05-04')
)
ORDER BY pw.employee_id, pw.week_start;

-- 3. ANÁLISIS DETALLADO POR EMPLEADO
SELECT 
    'ANÁLISIS POR EMPLEADO' as tipo,
    e.id as employee_id,
    e.name as employee_name,
    COUNT(ea.id) as asignaciones_semana,
    SUM(ea.daily_rate_used) as total_trabajado,
    -- Verificar si tiene semana pagada exacta
    (SELECT COUNT(*) FROM paid_weeks pw 
     WHERE pw.employee_id = e.id 
       AND pw.week_start = '2024-04-20' 
       AND pw.week_end = '2024-04-27') as tiene_semana_exacta,
    -- Verificar si tiene solapamientos
    (SELECT COUNT(*) FROM paid_weeks pw 
     WHERE pw.employee_id = e.id 
       AND pw.week_start <= '2024-04-27' 
       AND pw.week_end >= '2024-04-20'
       AND pw.amount > 0) as tiene_solapamientos_pagados
FROM employees e
LEFT JOIN employee_assignments ea ON e.id = ea.employee_id 
    AND ea.assignment_date >= '2024-04-20' 
    AND ea.assignment_date <= '2024-04-27'
WHERE ea.id IS NOT NULL  -- Solo empleados con asignaciones esa semana
GROUP BY e.id, e.name
ORDER BY e.name;

-- 4. VERIFICAR REGISTROS PROBLEMÁTICOS
SELECT 
    'REGISTROS PROBLEMÁTICOS' as tipo,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.notes,
    CASE 
        WHEN pw.amount = 0 THEN 'PENDIENTE EXPLÍCITO'
        WHEN pw.amount > 0 THEN 'PAGADO'
        ELSE 'ESTADO DESCONOCIDO'
    END as estado_interpretado
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE pw.week_start <= '2024-04-27' 
  AND pw.week_end >= '2024-04-20'
ORDER BY pw.employee_id, pw.week_start;
