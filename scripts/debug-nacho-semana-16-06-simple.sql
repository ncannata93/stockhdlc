-- 🔍 DIAGNÓSTICO SIMPLE: Nacho semana 16/06
-- Verificar datos de Nacho para la semana del 16 de junio

-- 1. Datos básicos del empleado
SELECT 'EMPLEADO' as tipo, id, name, daily_rate 
FROM employees 
WHERE name = 'Nacho';

-- 2. Asignaciones de la semana 16-22 junio
SELECT 'ASIGNACIONES' as tipo, 
       assignment_date, 
       hotel_name, 
       daily_rate_used,
       notes
FROM employee_assignments 
WHERE employee_id = 5 
  AND assignment_date BETWEEN '2025-06-16' AND '2025-06-22'
ORDER BY assignment_date;

-- 3. Registros de pagos para esa semana
SELECT 'PAGOS' as tipo,
       week_start,
       week_end, 
       amount,
       paid_date,
       notes
FROM paid_weeks 
WHERE employee_id = 5 
  AND (
    (week_start <= '2025-06-16' AND week_end >= '2025-06-16') OR
    (week_start <= '2025-06-22' AND week_end >= '2025-06-22') OR
    (week_start >= '2025-06-16' AND week_end <= '2025-06-22')
  )
ORDER BY week_start;
