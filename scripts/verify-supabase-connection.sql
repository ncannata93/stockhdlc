-- Verificar conexión y tablas existentes
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('employees', 'employee_assignments', 'employee_payments')
ORDER BY tablename;

-- Verificar estructura de la tabla employee_payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employee_payments'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros en cada tabla
SELECT 
    'employees' as tabla,
    COUNT(*) as total_registros
FROM employees
UNION ALL
SELECT 
    'employee_assignments' as tabla,
    COUNT(*) as total_registros
FROM employee_assignments
UNION ALL
SELECT 
    'employee_payments' as tabla,
    COUNT(*) as total_registros
FROM employee_payments;
