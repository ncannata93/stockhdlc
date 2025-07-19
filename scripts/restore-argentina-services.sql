-- Script para restaurar servicios de Argentina si fueron eliminados por error

-- Primero, reactivar servicios que puedan haber sido desactivados
UPDATE services 
SET active = true, updated_at = NOW()
WHERE hotel_id = '4' 
AND active = false;

-- Crear servicios básicos para Argentina si no existen
-- (Solo ejecutar si realmente faltan servicios)

-- Verificar qué servicios básicos debería tener Argentina
INSERT INTO services (id, name, description, category, hotel_id, hotel_name, active, average_amount, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Cesop Luz Argentina',
    'Servicio de electricidad',
    'electricidad',
    '4',
    'Argentina',
    true,
    50000,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM services 
    WHERE hotel_id = '4' 
    AND name ILIKE '%luz%' 
    AND active = true
);

INSERT INTO services (id, name, description, category, hotel_id, hotel_name, active, average_amount, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Cesop Gas Argentina',
    'Servicio de gas',
    'gas',
    '4',
    'Argentina',
    true,
    30000,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM services 
    WHERE hotel_id = '4' 
    AND name ILIKE '%gas%' 
    AND active = true
);

INSERT INTO services (id, name, description, category, hotel_id, hotel_name, active, average_amount, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'ABSA Agua Argentina',
    'Servicio de agua',
    'agua',
    '4',
    'Argentina',
    true,
    25000,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM services 
    WHERE hotel_id = '4' 
    AND name ILIKE '%agua%' 
    AND active = true
);

-- Mostrar resultado
SELECT 
    'SERVICIOS RESTAURADOS' as resultado,
    COUNT(*) as cantidad
FROM services 
WHERE hotel_id = '4' 
AND active = true;
