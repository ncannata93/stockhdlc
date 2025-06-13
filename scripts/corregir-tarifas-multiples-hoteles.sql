-- Script para corregir tarifas cuando un empleado trabaja en múltiples hoteles el mismo día

-- Primero, identificar los casos problemáticos
WITH empleados_multiples_hoteles AS (
  SELECT 
    ea.employee_id,
    ea.assignment_date,
    e.name as employee_name,
    e.daily_rate,
    COUNT(*) as num_hoteles,
    ARRAY_AGG(ea.hotel_name) as hoteles,
    ARRAY_AGG(ea.daily_rate_used) as tarifas_actuales,
    ARRAY_AGG(ea.id) as assignment_ids,
    -- Calcular la tarifa que debería tener cada hotel
    ROUND(e.daily_rate / COUNT(*)) as tarifa_correcta
  FROM employee_assignments ea
  JOIN employees e ON ea.employee_id = e.id
  WHERE ea.assignment_date >= '2025-06-01' 
    AND ea.assignment_date <= '2025-06-30'
  GROUP BY ea.employee_id, ea.assignment_date, e.name, e.daily_rate
  HAVING COUNT(*) > 1  -- Solo empleados con múltiples hoteles el mismo día
),
casos_problematicos AS (
  SELECT *,
    -- Verificar si alguna tarifa actual es diferente a la tarifa correcta
    EXISTS(
      SELECT 1 
      FROM UNNEST(tarifas_actuales) as tarifa 
      WHERE ABS(tarifa - tarifa_correcta) > 1
    ) as necesita_correccion
  FROM empleados_multiples_hoteles
)

-- Mostrar los casos que necesitan corrección
SELECT 
  employee_name as "👤 Empleado",
  assignment_date as "📅 Fecha",
  daily_rate as "💰 Tarifa Diaria",
  num_hoteles as "🏨 Num Hoteles",
  hoteles as "🏨 Hoteles",
  tarifas_actuales as "💰 Tarifas Actuales",
  tarifa_correcta as "💰 Tarifa Correcta",
  CASE 
    WHEN necesita_correccion THEN '❌ Necesita Corrección'
    ELSE '✅ Correcto'
  END as "📊 Estado"
FROM casos_problematicos
ORDER BY assignment_date DESC, employee_name;
