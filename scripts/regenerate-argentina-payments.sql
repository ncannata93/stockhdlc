-- Regenerar pagos faltantes para Argentina en 2025
SELECT 'REGENERANDO PAGOS DE ARGENTINA PARA 2025' as titulo;

DO $$
DECLARE
    service_record RECORD;
    month_num INTEGER;
    payment_exists BOOLEAN;
    payments_created INTEGER := 0;
BEGIN
    -- Para cada servicio de Argentina
    FOR service_record IN 
        SELECT s.id, s.name, s.average_amount, s.hotel_id, h.name as hotel_name
        FROM services s
        JOIN hotels h ON s.hotel_id = h.id
        WHERE h.name ILIKE '%argentina%'
        AND s.active = true
    LOOP
        RAISE NOTICE 'Procesando servicio: % (ID: %)', service_record.name, service_record.id;
        
        -- Para cada mes de 2025
        FOR month_num IN 1..12 LOOP
            -- Verificar si ya existe el pago para este mes
            SELECT EXISTS (
                SELECT 1 FROM service_payments
                WHERE service_id = service_record.id
                AND month = month_num
                AND year = 2025
            ) INTO payment_exists;
            
            IF NOT payment_exists THEN
                -- Crear el pago faltante
                INSERT INTO service_payments (
                    id,
                    service_id,
                    service_name,
                    hotel_id,
                    hotel_name,
                    month,
                    year,
                    amount,
                    due_date,
                    status,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    service_record.id,
                    service_record.name,
                    service_record.hotel_id,
                    service_record.hotel_name,
                    month_num,
                    2025,
                    service_record.average_amount,
                    DATE('2025-' || LPAD(month_num::TEXT, 2, '0') || '-10'),
                    'pendiente',
                    'Generado automáticamente - Restauración Argentina',
                    NOW(),
                    NOW()
                );
                
                payments_created := payments_created + 1;
                
                IF month_num % 3 = 0 THEN
                    RAISE NOTICE '  - Creados pagos hasta mes %', month_num;
                END IF;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Servicio % completado', service_record.name;
    END LOOP;
    
    RAISE NOTICE 'REGENERACIÓN COMPLETADA: % pagos creados', payments_created;
END $$;

-- Verificar pagos creados
SELECT 
    'PAGOS CREADOS POR MES:' as resumen,
    sp.month,
    CASE sp.month 
        WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
    END as mes_nombre,
    COUNT(*) as cantidad_pagos,
    SUM(sp.amount) as monto_total
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
AND sp.year = 2025
GROUP BY sp.month
ORDER BY sp.month;

SELECT 'REGENERACIÓN DE PAGOS COMPLETADA' as resultado;
