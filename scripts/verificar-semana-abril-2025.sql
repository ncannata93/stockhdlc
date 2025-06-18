-- 🔍 VERIFICAR QUÉ HAY EN LA BASE DE DATOS PARA LA SEMANA 2025-04-21 AL 2025-04-28

-- 1. VERIFICAR ASIGNACIONES EN ESA SEMANA ESPECÍFICA
SELECT 
    '=== ASIGNACIONES SEMANA 2025-04-21 AL 2025-04-28 ===' as seccion,
    ea.id,
    ea.employee_id,
    e.name as employee_name,
    ea.assignment_date,
    ea.hotel_name,
    ea.daily_rate_used,
    ea.created_at
FROM employee_assignments ea
JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date >= '2025-04-21' 
  AND ea.assignment_date <= '2025-04-28'
ORDER BY ea.employee_id, ea.assignment_date;

-- 2. BUSCAR SEMANAS PAGADAS QUE PODRÍAN SOLAPARSE CON 2025-04-21 AL 2025-04-28
SELECT 
    '=== SEMANAS PAGADAS QUE PODRÍAN SOLAPARSE ===' as seccion,
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date,
    pw.notes,
    -- Calcular si hay solapamiento
    CASE 
        WHEN pw.week_start <= '2025-04-28' AND pw.week_end >= '2025-04-21' 
        THEN '✅ SOLAPAMIENTO DETECTADO'
        ELSE '❌ SIN SOLAPAMIENTO'
    END as solapamiento_status,
    -- Calcular días de solapamiento
    CASE 
        WHEN pw.week_start <= '2025-04-28' AND pw.week_end >= '2025-04-21' THEN
            EXTRACT(DAY FROM 
                LEAST(DATE '2025-04-28', pw.week_end::date) - 
                GREATEST(DATE '2025-04-21', pw.week_start::date)
            ) + 1
        ELSE 0
    END as dias_solapamiento
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE pw.employee_id IN (2, 3, 4) -- David, Diego, Tucu
  AND (
    -- Semanas que podrían solaparse
    (pw.week_start <= '2025-04-28' AND pw.week_end >= '2025-04-21')
    OR 
    -- Semanas cercanas para contexto
    (pw.week_start >= '2025-04-14' AND pw.week_start <= '2025-05-05')
  )
ORDER BY pw.employee_id, pw.week_start;

-- 3. BUSCAR REGISTROS EXACTOS PARA ESA SEMANA
SELECT 
    '=== REGISTROS EXACTOS PARA 2025-04-21 AL 2025-04-28 ===' as seccion,
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date,
    pw.notes,
    CASE 
        WHEN pw.amount = 0 THEN '⏰ PENDIENTE EXPLÍCITO'
        WHEN pw.amount > 0 THEN '💰 PAGADO'
        ELSE '❓ ESTADO DESCONOCIDO'
    END as estado
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE pw.week_start = '2025-04-21' 
  AND pw.week_end = '2025-04-28'
ORDER BY pw.employee_id;

-- 4. MOSTRAR TODOS LOS REGISTROS DE ABRIL PARA CONTEXTO
SELECT 
    '=== TODOS LOS REGISTROS DE ABRIL 2025 ===' as seccion,
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date,
    pw.notes
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE pw.week_start >= '2025-04-01' 
  AND pw.week_start < '2025-05-01'
ORDER BY pw.employee_id, pw.week_start;

-- 5. VERIFICAR SI HAY PROBLEMAS DE FORMATO EN LAS FECHAS
SELECT 
    '=== VERIFICAR FORMATOS DE FECHA PROBLEMÁTICOS ===' as seccion,
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    LENGTH(pw.week_start::text) as longitud_start,
    LENGTH(pw.week_end::text) as longitud_end,
    pw.week_start::text as start_text,
    pw.week_end::text as end_text
FROM paid_weeks pw
JOIN employees e ON pw.employee_id = e.id
WHERE pw.week_start::text LIKE '%2025-04%'
   OR pw.week_end::text LIKE '%2025-04%'
ORDER BY pw.employee_id, pw.week_start;
