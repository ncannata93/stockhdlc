-- Regenerar pagos faltantes para Argentina
-- Este script crea pagos para los próximos 12 meses para todos los servicios de Argentina

DO $$
DECLARE
    service_record RECORD;
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    month_iter INTEGER;
    year_iter INTEGER;
    due_date_calc DATE;
BEGIN
    RAISE NOTICE 'Iniciando regeneración de pagos para Argentina...';
    RAISE NOTICE 'Mes actual: %, Año actual: %', current_month, current_year;
    
    -- Para cada servicio de Argentina
    FOR service_record IN 
        SELECT s.id, s.name, s.hotel_id, s.average_amount, h.name as hotel_name
        FROM services s
        JOIN hotels h ON s.hotel_id = h.id
        WHERE h.name ILIKE '%argentina%' AND s.active = true
    LOOP
        RAISE NOTICE 'Procesando servicio: % (ID: %)', service_record.name, service_record.id;
        
        -- Generar pagos para los próximos 12 meses
        FOR i IN 0..11 LOOP
            month_iter := ((current_month - 1 + i) % 12) + 1;
            year_iter := current_year + ((current_month - 1 + i) / 12);
            
            -- Calcular fecha de vencimiento (día 10 del mismo mes)
            due_date_calc := make_date(year_iter, month_iter, 10);
            
            -- Verificar si ya existe un pago para este servicio en este mes/año
            IF NOT EXISTS (
                SELECT 1 FROM service_payments 
                WHERE service_id = service_record.id 
                  AND month = month_iter 
                  AND year = year_iter
            ) THEN
                -- Insertar el pago
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
                    gen_random_uuid()::text,
                    service_record.id,
                    service_record.name,
                    service_record.hotel_id,
                    service_record.hotel_name,
                    month_iter,
                    year_iter,
                    COALESCE(service_record.average_amount, 0),
                    due_date_calc,
                    'pendiente',
                    'Generado automáticamente - Restauración Argentina',
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Pago creado: % - %/% - $%', 
                    service_record.name, month_iter, year_iter, 
                    COALESCE(service_record.average_amount, 0);
            ELSE
                RAISE NOTICE 'Pago ya existe: % - %/%', 
                    service_record.name, month_iter, year_iter;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Regeneración de pagos completada para Argentina';
END $$;

-- Mostrar resumen de pagos creados
SELECT 
    sp.service_name,
    COUNT(*) as pagos_creados,
    SUM(sp.amount) as total_amount,
    MIN(sp.year || '-' || LPAD(sp.month::text, 2, '0')) as primer_mes,
    MAX(sp.year || '-' || LPAD(sp.month::text, 2, '0')) as ultimo_mes
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
  AND sp.notes LIKE '%Restauración Argentina%'
GROUP BY sp.service_name
ORDER BY sp.service_name;
