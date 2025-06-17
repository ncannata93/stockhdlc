-- Diagnóstico completo de la tabla paid_weeks
SELECT 'ESTRUCTURA DE LA TABLA paid_weeks' as diagnostico;

-- Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'paid_weeks' 
ORDER BY ordinal_position;

SELECT 'CONTENIDO DE LA TABLA paid_weeks' as diagnostico;

-- Ver todos los registros de paid_weeks
SELECT 
    id,
    employee_id,
    week_start,
    week_end,
    amount,
    paid_date,
    notes,
    created_at
FROM paid_weeks 
ORDER BY created_at DESC
LIMIT 20;

SELECT 'CONTEO POR EMPLEADO' as diagnostico;

-- Contar semanas pagadas por empleado
SELECT 
    pw.employee_id,
    e.name as employee_name,
    COUNT(*) as semanas_pagadas,
    SUM(pw.amount) as total_pagado
FROM paid_weeks pw
LEFT JOIN employees e ON pw.employee_id = e.id
GROUP BY pw.employee_id, e.name
ORDER BY semanas_pagadas DESC;

SELECT 'SEMANAS PAGADAS RECIENTES (8 semanas)' as diagnostico;

-- Ver semanas pagadas en las últimas 8 semanas
SELECT 
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date
FROM paid_weeks pw
LEFT JOIN employees e ON pw.employee_id = e.id
WHERE pw.week_start >= CURRENT_DATE - INTERVAL '8 weeks'
ORDER BY pw.week_start DESC;

SELECT 'VERIFICAR FECHAS' as diagnostico;

-- Verificar formato de fechas
SELECT 
    week_start,
    week_end,
    paid_date,
    EXTRACT(DOW FROM week_start::date) as day_of_week_start,
    EXTRACT(DOW FROM week_end::date) as day_of_week_end
FROM paid_weeks
ORDER BY week_start DESC
LIMIT 10;
