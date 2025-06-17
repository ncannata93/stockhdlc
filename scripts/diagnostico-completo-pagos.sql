-- DIAGNÓSTICO COMPLETO DEL SISTEMA DE PAGOS

-- 1. Ver todas las asignaciones recientes
SELECT 'ASIGNACIONES ÚLTIMAS 8 SEMANAS' as seccion;
SELECT 
    ea.id,
    ea.employee_id,
    e.name as employee_name,
    ea.assignment_date,
    ea.hotel_name,
    ea.daily_rate_used,
    DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date - INTERVAL '1 day' as week_start_calc,
    DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date + INTERVAL '5 days' as week_end_calc
FROM employee_assignments ea
LEFT JOIN employees e ON ea.employee_id = e.id
WHERE ea.assignment_date >= CURRENT_DATE - INTERVAL '8 weeks'
ORDER BY ea.assignment_date DESC
LIMIT 20;

-- 2. Ver todas las semanas pagadas
SELECT 'SEMANAS PAGADAS' as seccion;
SELECT 
    pw.id,
    pw.employee_id,
    e.name as employee_name,
    pw.week_start,
    pw.week_end,
    pw.amount,
    pw.paid_date,
    pw.notes
FROM paid_weeks pw
LEFT JOIN employees e ON pw.employee_id = e.id
ORDER BY pw.week_start DESC
LIMIT 20;

-- 3. Agrupar asignaciones por semana
SELECT 'ASIGNACIONES AGRUPADAS POR SEMANA' as seccion;
WITH weekly_assignments AS (
    SELECT 
        ea.employee_id,
        e.name as employee_name,
        DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date - INTERVAL '1 day' as week_start,
        DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date + INTERVAL '5 days' as week_end,
        COUNT(*) as days_worked,
        SUM(ea.daily_rate_used) as total_amount
    FROM employee_assignments ea
    LEFT JOIN employees e ON ea.employee_id = e.id
    WHERE ea.assignment_date >= CURRENT_DATE - INTERVAL '8 weeks'
    GROUP BY ea.employee_id, e.name, week_start, week_end
)
SELECT 
    wa.*,
    CASE 
        WHEN pw.id IS NOT NULL THEN 'PAGADA'
        ELSE 'PENDIENTE'
    END as status,
    pw.amount as paid_amount,
    pw.paid_date
FROM weekly_assignments wa
LEFT JOIN paid_weeks pw ON (
    wa.employee_id = pw.employee_id 
    AND wa.week_start = pw.week_start 
    AND wa.week_end = pw.week_end
)
ORDER BY wa.employee_name, wa.week_start DESC;

-- 4. Resumen de estado
SELECT 'RESUMEN DE ESTADO' as seccion;
WITH weekly_assignments AS (
    SELECT 
        ea.employee_id,
        DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date - INTERVAL '1 day' as week_start,
        DATE_TRUNC('week', ea.assignment_date::date + INTERVAL '1 day')::date + INTERVAL '5 days' as week_end,
        COUNT(*) as days_worked,
        SUM(ea.daily_rate_used) as total_amount
    FROM employee_assignments ea
    WHERE ea.assignment_date >= CURRENT_DATE - INTERVAL '8 weeks'
    GROUP BY ea.employee_id, week_start, week_end
),
status_summary AS (
    SELECT 
        wa.*,
        CASE 
            WHEN pw.id IS NOT NULL THEN 'PAGADA'
            ELSE 'PENDIENTE'
        END as status
    FROM weekly_assignments wa
    LEFT JOIN paid_weeks pw ON (
        wa.employee_id = pw.employee_id 
        AND wa.week_start = pw.week_start 
        AND wa.week_end = pw.week_end
    )
)
SELECT 
    status,
    COUNT(*) as cantidad_semanas,
    COUNT(DISTINCT employee_id) as empleados_afectados,
    SUM(total_amount) as monto_total
FROM status_summary
GROUP BY status;
