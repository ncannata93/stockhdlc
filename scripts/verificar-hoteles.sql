-- Verificar hoteles disponibles en la aplicación
SELECT 'Jaguel' AS hotel_name UNION ALL
SELECT 'Monaco' UNION ALL
SELECT 'Mallak' UNION ALL
SELECT 'Argentina' UNION ALL
SELECT 'Falkner' UNION ALL
SELECT 'Stromboli' UNION ALL
SELECT 'San Miguel' UNION ALL
SELECT 'Colores' UNION ALL
SELECT 'Puntarenas' UNION ALL
SELECT 'Tupe' UNION ALL
SELECT 'Munich' UNION ALL
SELECT 'Tiburones' UNION ALL
SELECT 'Barlovento' UNION ALL
SELECT 'Carama';

-- Verificar hoteles que ya tienen asignaciones
SELECT DISTINCT hotel_name 
FROM employee_assignments
WHERE hotel_name IS NOT NULL
ORDER BY hotel_name;

-- Verificar si hay hoteles en la lista predefinida que no tienen asignaciones
WITH predefined_hotels AS (
  SELECT 'Jaguel' AS hotel_name UNION ALL
  SELECT 'Monaco' UNION ALL
  SELECT 'Mallak' UNION ALL
  SELECT 'Argentina' UNION ALL
  SELECT 'Falkner' UNION ALL
  SELECT 'Stromboli' UNION ALL
  SELECT 'San Miguel' UNION ALL
  SELECT 'Colores' UNION ALL
  SELECT 'Puntarenas' UNION ALL
  SELECT 'Tupe' UNION ALL
  SELECT 'Munich' UNION ALL
  SELECT 'Tiburones' UNION ALL
  SELECT 'Barlovento' UNION ALL
  SELECT 'Carama'
)
SELECT 
  p.hotel_name,
  CASE WHEN a.hotel_name IS NULL THEN 'No tiene asignaciones' ELSE 'Tiene asignaciones' END AS status
FROM predefined_hotels p
LEFT JOIN (
  SELECT DISTINCT hotel_name FROM employee_assignments WHERE hotel_name IS NOT NULL
) a ON p.hotel_name = a.hotel_name
ORDER BY p.hotel_name;
