-- 🔧 CORRECCIÓN ESPECÍFICA: Problema semanas abril 2024 (20/04 al 27/04)
-- Basado en el diagnóstico realizado

-- PASO 1: Identificar el problema específico
-- (Ejecutar primero para ver qué necesita corrección)

-- Si hay registros con amount = 0 (pendiente explícito por error):
UPDATE paid_weeks 
SET amount = (
    -- Calcular el monto correcto basado en las asignaciones reales
    SELECT COALESCE(SUM(ea.daily_rate_used), 0)
    FROM employee_assignments ea
    WHERE ea.employee_id = paid_weeks.employee_id
      AND ea.assignment_date >= '2024-04-20'
      AND ea.assignment_date <= '2024-04-27'
),
notes = CONCAT(COALESCE(notes, ''), ' - Corregido automáticamente el ', CURRENT_DATE)
WHERE week_start = '2024-04-20' 
  AND week_end = '2024-04-27'
  AND amount = 0
  AND EXISTS (
    SELECT 1 FROM employee_assignments ea 
    WHERE ea.employee_id = paid_weeks.employee_id
      AND ea.assignment_date >= '2024-04-20'
      AND ea.assignment_date <= '2024-04-27'
  );

-- PASO 2: Crear registros faltantes para empleados que trabajaron pero no tienen registro de pago
INSERT INTO paid_weeks (employee_id, week_start, week_end, amount, paid_date, notes)
SELECT DISTINCT
    ea.employee_id,
    '2024-04-20' as week_start,
    '2024-04-27' as week_end,
    SUM(ea.daily_rate_used) as amount,
    '2024-04-28' as paid_date,
    'Registro creado automáticamente - Semana abril 20-27' as notes
FROM employee_assignments ea
WHERE ea.assignment_date >= '2024-04-20'
  AND ea.assignment_date <= '2024-04-27'
  AND NOT EXISTS (
    -- No existe registro de pago para esta semana exacta
    SELECT 1 FROM paid_weeks pw 
    WHERE pw.employee_id = ea.employee_id
      AND pw.week_start = '2024-04-20'
      AND pw.week_end = '2024-04-27'
  )
  AND NOT EXISTS (
    -- No existe solapamiento significativo con otras semanas pagadas
    SELECT 1 FROM paid_weeks pw 
    WHERE pw.employee_id = ea.employee_id
      AND pw.week_start <= '2024-04-27'
      AND pw.week_end >= '2024-04-20'
      AND pw.amount > 0
  )
GROUP BY ea.employee_id;

-- PASO 3: Verificar que la corrección funcionó
SELECT 
    'VERIFICACIÓN POST-CORRECCIÓN' as tipo,
    e.name as empleado,
    COUNT(ea.id) as dias_trabajados,
    SUM(ea.daily_rate_used) as total_trabajado,
    pw.amount as monto_pagado,
    pw.notes,
    CASE 
        WHEN pw.amount > 0 THEN '✅ PAGADO'
        WHEN pw.amount = 0 THEN '⏰ PENDIENTE EXPLÍCITO'
        ELSE '❌ SIN REGISTRO'
    END as estado_final
FROM employees e
JOIN employee_assignments ea ON e.id = ea.employee_id
LEFT JOIN paid_weeks pw ON e.id = pw.employee_id 
    AND pw.week_start = '2024-04-20' 
    AND pw.week_end = '2024-04-27'
WHERE ea.assignment_date >= '2024-04-20' 
  AND ea.assignment_date <= '2024-04-27'
GROUP BY e.id, e.name, pw.amount, pw.notes
ORDER BY e.name;
