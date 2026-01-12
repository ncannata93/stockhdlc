-- Verificar si la tabla prestamos existe y su estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prestamos' 
ORDER BY ordinal_position;

-- Verificar si hay datos en la tabla
SELECT COUNT(*) as total_prestamos FROM prestamos;

-- Verificar los últimos registros
SELECT * FROM prestamos ORDER BY created_at DESC LIMIT 5;
