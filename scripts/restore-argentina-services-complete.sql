-- Restaurar servicios completos de Argentina
-- Este script recrea todos los servicios que tenía Argentina

-- Primero, verificar que existe el hotel Argentina
DO $$
DECLARE
    argentina_hotel_id TEXT;
BEGIN
    -- Buscar el hotel Argentina
    SELECT id INTO argentina_hotel_id 
    FROM hotels 
    WHERE name ILIKE '%argentina%' 
    LIMIT 1;
    
    -- Si no existe, crearlo
    IF argentina_hotel_id IS NULL THEN
        INSERT INTO hotels (id, name, address, phone, created_at, updated_at)
        VALUES (
            gen_random_uuid()::text,
            'Hotel Argentina',
            'Dirección Hotel Argentina',
            'Tel: Argentina',
            NOW(),
            NOW()
        )
        RETURNING id INTO argentina_hotel_id;
        
        RAISE NOTICE 'Hotel Argentina creado con ID: %', argentina_hotel_id;
    ELSE
        RAISE NOTICE 'Hotel Argentina encontrado con ID: %', argentina_hotel_id;
    END IF;
    
    -- Restaurar servicios de Argentina basándose en los pagos existentes
    -- Primero, obtener servicios únicos de los pagos
    INSERT INTO services (
        id,
        name,
        description,
        hotel_id,
        hotel_name,
        average_amount,
        active,
        created_at,
        updated_at
    )
    SELECT DISTINCT
        gen_random_uuid()::text as id,
        sp.service_name as name,
        'Servicio restaurado automáticamente' as description,
        argentina_hotel_id as hotel_id,
        'Hotel Argentina' as hotel_name,
        COALESCE(AVG(sp.amount), 0) as average_amount,
        true as active,
        NOW() as created_at,
        NOW() as updated_at
    FROM service_payments sp
    WHERE sp.hotel_name ILIKE '%argentina%'
      AND sp.service_name IS NOT NULL
      AND sp.service_name != ''
      AND NOT EXISTS (
          SELECT 1 FROM services s2 
          WHERE s2.name = sp.service_name 
            AND s2.hotel_id = argentina_hotel_id
            AND s2.active = true
      )
    GROUP BY sp.service_name;
    
    -- Si no hay pagos, crear servicios básicos comunes
    IF NOT EXISTS (
        SELECT 1 FROM service_payments 
        WHERE hotel_name ILIKE '%argentina%'
    ) THEN
        INSERT INTO services (
            id, name, description, hotel_id, hotel_name, 
            average_amount, active, created_at, updated_at
        ) VALUES
        (gen_random_uuid()::text, 'Luz', 'Servicio de electricidad', argentina_hotel_id, 'Hotel Argentina', 15000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Agua', 'Servicio de agua potable', argentina_hotel_id, 'Hotel Argentina', 8000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Gas', 'Servicio de gas natural', argentina_hotel_id, 'Hotel Argentina', 12000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Internet', 'Servicio de internet', argentina_hotel_id, 'Hotel Argentina', 5000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Teléfono', 'Servicio telefónico', argentina_hotel_id, 'Hotel Argentina', 3000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Limpieza', 'Servicio de limpieza', argentina_hotel_id, 'Hotel Argentina', 10000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Seguridad', 'Servicio de seguridad', argentina_hotel_id, 'Hotel Argentina', 20000, true, NOW(), NOW()),
        (gen_random_uuid()::text, 'Mantenimiento', 'Servicio de mantenimiento', argentina_hotel_id, 'Hotel Argentina', 7000, true, NOW(), NOW());
        
        RAISE NOTICE 'Servicios básicos creados para Hotel Argentina';
    END IF;
    
    RAISE NOTICE 'Restauración de servicios de Argentina completada';
END $$;

-- Verificar servicios restaurados
SELECT 
    s.id,
    s.name,
    s.description,
    s.average_amount,
    s.active,
    h.name as hotel_name
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%'
ORDER BY s.name;
