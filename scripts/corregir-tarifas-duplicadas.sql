-- Script para corregir tarifas duplicadas cuando un empleado trabaja en múltiples hoteles el mismo día

-- Paso 1: Identificar asignaciones que necesitan corrección
WITH asignaciones_por_dia AS (
  SELECT 
    employee_id,
    assignment_date,
    COUNT(*) as hoteles_count,
    MAX(daily_rate_used) as tarifa_original,
    ARRAY_AGG(id) as assignment_ids
  FROM employee_assignments 
  WHERE notes LIKE '%Importado masivamente%'
  GROUP BY employee_id, assignment_date
  HAVING COUNT(*) > 1
),
tarifas_corregidas AS (
  SELECT 
    employee_id,
    assignment_date,
    hoteles_count,
    tarifa_original,
    tarifa_original / hoteles_count as tarifa_dividida,
    assignment_ids
  FROM asignaciones_por_dia
)
SELECT 
  e.name as empleado,
  tc.assignment_date as fecha,
  tc.hoteles_count as hoteles,
  tc.tarifa_original as tarifa_actual,
  tc.tarifa_dividida as tarifa_correcta,
  tc.tarifa_original * tc.hoteles_count as total_actual,
  tc.tarifa_original as total_correcto
FROM tarifas_corregidas tc
JOIN employees e ON e.id = tc.employee_id
ORDER BY tc.assignment_date DESC;

-- Paso 2: Actualizar las tarifas (descomenta para ejecutar)
/*
UPDATE employee_assignments 
SET daily_rate_used = (
  SELECT daily_rate_used / (
    SELECT COUNT(*) 
    FROM employee_assignments ea2 
    WHERE ea2.employee_id = employee_assignments.employee_id 
    AND ea2.assignment_date = employee_assignments.assignment_date
    AND ea2.notes LIKE '%Importado masivamente%'
  )
)
WHERE notes LIKE '%Importado masivamente%'
AND id IN (
  SELECT UNNEST(assignment_ids)
  FROM (
    SELECT 
      employee_id,
      assignment_date,
      ARRAY_AGG(id) as assignment_ids
    FROM employee_assignments 
    WHERE notes LIKE '%Importado masivamente%'
    GROUP BY employee_id, assignment_date
    HAVING COUNT(*) > 1
  ) grouped
);
*/
