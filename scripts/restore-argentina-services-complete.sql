-- Restaurar servicios completos de Argentina
SELECT 'RESTAURANDO SERVICIOS DE ARGENTINA' as titulo;

-- 1. Verificar/crear hotel Argentina
DO $$
DECLARE
    argentina_hotel_id UUID;
BEGIN
    -- Buscar hotel Argentina
    SELECT id INTO argentina_hotel_id
    FROM hotels
    WHERE name ILIKE '%argentina%'
    LIMIT 1;
    
    IF argentina_hotel_id IS NULL THEN
        -- Crear hotel Argentina
        INSERT INTO hotels (id, name, address, phone, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Hotel Argentina',
            'Av. Argentina 1234, Mar del Plata',
            '+54 223 123-4567',
            NOW(),
            NOW()
        ) RETURNING id INTO argentina_hotel_id;
        
        RAISE NOTICE 'Hotel Argentina creado con ID: %', argentina_hotel_id;
    ELSE
        RAISE NOTICE 'Hotel Argentina encontrado con ID: %', argentina_hotel_id;
    END IF;
    
    -- Crear servicios típicos de hotel
    INSERT INTO services (id, name, description, category, provider, account_number, hotel_id, notes, active, average_amount, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'Electricidad', 'Suministro eléctrico del hotel', 'Servicios Básicos', 'EDEA', 'ARG-ELEC-001', argentina_hotel_id, 'Servicio eléctrico principal', true, 45000, NOW(), NOW()),
        (gen_random_uuid(), 'Gas Natural', 'Suministro de gas natural', 'Servicios Básicos', 'Camuzzi Gas', 'ARG-GAS-001', argentina_hotel_id, 'Gas para calefacción y cocina', true, 28000, NOW(), NOW()),
        (gen_random_uuid(), 'Agua Potable', 'Suministro de agua potable', 'Servicios Básicos', 'OSSE', 'ARG-AGUA-001', argentina_hotel_id, 'Agua potable y cloacas', true, 15000, NOW(), NOW()),
        (gen_random_uuid(), 'Internet Fibra Óptica', 'Conexión a internet de alta velocidad', 'Telecomunicaciones', 'Telecom', 'ARG-INT-001', argentina_hotel_id, 'Internet 100MB simétrico', true, 12000, NOW(), NOW()),
        (gen_random_uuid(), 'Teléfono Fijo', 'Línea telefónica fija', 'Telecomunicaciones', 'Telecom', 'ARG-TEL-001', argentina_hotel_id, 'Línea principal del hotel', true, 3500, NOW(), NOW()),
        (gen_random_uuid(), 'Cable TV', 'Televisión por cable', 'Entretenimiento', 'DirecTV', 'ARG-TV-001', argentina_hotel_id, 'Paquete premium para habitaciones', true, 8500, NOW(), NOW()),
        (gen_random_uuid(), 'Seguridad 24hs', 'Servicio de seguridad las 24 horas', 'Seguridad', 'Prosegur', 'ARG-SEG-001', argentina_hotel_id, 'Vigilancia y monitoreo', true, 35000, NOW(), NOW()),
        (gen_random_uuid(), 'Limpieza General', 'Servicio de limpieza integral', 'Mantenimiento', 'Clean Master', 'ARG-LIMP-001', argentina_hotel_id, 'Limpieza diaria de áreas comunes', true, 25000, NOW(), NOW()),
        (gen_random_uuid(), 'Mantenimiento Técnico', 'Mantenimiento preventivo y correctivo', 'Mantenimiento', 'TecnoService', 'ARG-MANT-001', argentina_hotel_id, 'Mantenimiento de instalaciones', true, 18000, NOW(), NOW()),
        (gen_random_uuid(), 'CESOP 6036', 'Contribución Especial Solidaria de Obras Públicas', 'Impuestos', 'Municipalidad', 'ARG-CESOP-001', argentina_hotel_id, 'Impuesto municipal especial', true, 22000, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Servicios de Argentina creados exitosamente';
END $$;

-- 2. Verificar servicios creados
SELECT 
    'SERVICIOS CREADOS PARA ARGENTINA:' as resultado,
    s.name as servicio,
    s.category,
    s.provider,
    s.average_amount,
    s.active
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%'
ORDER BY s.name;

SELECT 'RESTAURACIÓN DE SERVICIOS COMPLETADA' as estado;
