-- Restaurar empleados básicos si fueron eliminados
INSERT INTO employees (name, role, daily_rate) 
VALUES 
    ('Diego', 'Mantenimiento', 34700),
    ('Tucu', 'Mantenimiento', 15000),
    ('Carlos', 'Mantenimiento', 20000),
    ('Ana', 'Limpieza', 18000),
    ('Luis', 'Mantenimiento', 25000)
ON CONFLICT (name) DO UPDATE SET
    daily_rate = EXCLUDED.daily_rate,
    role = EXCLUDED.role;

-- Verificar que se crearon correctamente
SELECT 
    id,
    name,
    role,
    daily_rate,
    created_at
FROM employees 
ORDER BY name;
