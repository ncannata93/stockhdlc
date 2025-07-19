-- Script para debuggear límites en los pagos de servicios
-- Ejecutar este script para verificar si hay algún límite configurado

-- 1. Contar total de registros en service_payments
SELECT 
    'Total service_payments' as descripcion,
    COUNT(*) as cantidad
FROM service_payments;

-- 2. Verificar si hay algún límite en las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'service_payments';

-- 3. Verificar configuración de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'service_payments'
ORDER BY ordinal_position;

-- 4. Verificar índices que podrían afectar el rendimiento
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'service_payments';

-- 5. Verificar si hay triggers que podrían limitar inserciones
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'service_payments';

-- 6. Contar pagos por hotel para verificar distribución
SELECT 
    h.name as hotel_name,
    COUNT(sp.*) as total_pagos
FROM hotels h
LEFT JOIN service_payments sp ON h.id = sp.hotel_id
GROUP BY h.id, h.name
ORDER BY total_pagos DESC;

-- 7. Contar pagos por año para verificar distribución temporal
SELECT 
    year,
    COUNT(*) as total_pagos
FROM service_payments
GROUP BY year
ORDER BY year DESC;

-- 8. Verificar si hay duplicados que podrían estar causando problemas
SELECT 
    service_id,
    month,
    year,
    COUNT(*) as duplicados
FROM service_payments
GROUP BY service_id, month, year
HAVING COUNT(*) > 1
ORDER BY duplicados DESC;

-- 9. Verificar los últimos 10 pagos insertados
SELECT 
    id,
    service_name,
    month,
    year,
    amount,
    status,
    created_at
FROM service_payments
ORDER BY created_at DESC
LIMIT 10;

-- 10. Verificar configuración de conexión y límites de Supabase
SELECT 
    name,
    setting,
    unit,
    context
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers',
    'work_mem',
    'maintenance_work_mem'
);
