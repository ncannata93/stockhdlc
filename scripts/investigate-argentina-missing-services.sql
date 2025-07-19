-- Investigar servicios faltantes de Argentina
-- Este script verifica qué servicios tenía Argentina antes y cuáles faltan ahora

-- 1. Verificar si existe el hotel Argentina
SELECT 
    id, 
    name, 
    created_at,
    CASE 
        WHEN created_at IS NULL THEN 'Sin fecha de creación'
        ELSE 'Creado el ' || created_at::date
    END as status
FROM hotels 
WHERE name ILIKE '%argentina%';

-- 2. Verificar servicios actuales de Argentina
SELECT 
    s.id,
    s.name,
    s.description,
    s.hotel_id,
    s.active,
    s.created_at,
    h.name as hotel_name
FROM services s
LEFT JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%'
ORDER BY s.created_at DESC;

-- 3. Verificar pagos existentes que mencionan Argentina
SELECT 
    sp.id,
    sp.service_name,
    sp.hotel_name,
    sp.month,
    sp.year,
    sp.amount,
    sp.status,
    sp.created_at
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
ORDER BY sp.year DESC, sp.month DESC
LIMIT 20;

-- 4. Buscar servicios eliminados recientemente (si hay logs)
SELECT 
    s.id,
    s.name,
    s.active,
    s.updated_at,
    h.name as hotel_name
FROM services s
LEFT JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%' AND s.active = false
ORDER BY s.updated_at DESC;

-- 5. Contar total de registros relacionados con Argentina
SELECT 
    'Servicios activos' as tipo,
    COUNT(*) as cantidad
FROM services s
LEFT JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%' AND s.active = true

UNION ALL

SELECT 
    'Servicios inactivos' as tipo,
    COUNT(*) as cantidad
FROM services s
LEFT JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%' AND s.active = false

UNION ALL

SELECT 
    'Pagos registrados' as tipo,
    COUNT(*) as cantidad
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%';
