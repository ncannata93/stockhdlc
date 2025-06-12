-- Verificar el estado actual de las tablas de empleados
SELECT 'Verificando tabla employees...' as status;

-- Verificar si la tabla employees existe
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Contar empleados actuales
SELECT 'Empleados actuales:' as info, COUNT(*) as total FROM employees;

-- Verificar tabla de asignaciones
SELECT 'Verificando tabla employee_assignments...' as status;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_assignments' 
ORDER BY ordinal_position;

-- Contar asignaciones actuales
SELECT 'Asignaciones actuales:' as info, COUNT(*) as total FROM employee_assignments;

-- Si no hay empleados, crear algunos básicos
INSERT INTO employees (name, role, daily_rate) 
SELECT * FROM (VALUES 
  ('Juan Pérez', 'Mantenimiento', 50000),
  ('María López', 'Limpieza', 45000),
  ('Carlos Rodríguez', 'Mantenimiento', 52000),
  ('Ana García', 'Mantenimiento', 48000),
  ('Diego Martínez', 'Mantenimiento', 34700)
) AS v(name, role, daily_rate)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE name = v.name);

-- Mostrar empleados después de la inserción
SELECT 'Empleados después de restauración:' as info;
SELECT id, name, role, daily_rate, created_at FROM employees ORDER BY name;
