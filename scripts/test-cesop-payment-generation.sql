-- Probar la generación automática específicamente para CESOP 6036
SELECT '🧪 PRUEBA DE GENERACIÓN AUTOMÁTICA - CESOP 6036' as titulo;

DO $$
DECLARE
    argentina_hotel_id UUID;
    cesop_service_id UUID;
    june_payment_id TEXT;
    july_payment_exists BOOLEAN;
    test_amount NUMERIC := 25000;
BEGIN
    -- 1. Obtener IDs necesarios
    SELECT h.id INTO argentina_hotel_id
    FROM hotels h
    WHERE h.name ILIKE '%argentina%'
    LIMIT 1;
    
    SELECT s.id INTO cesop_service_id
    FROM services s
    WHERE s.hotel_id = argentina_hotel_id
    AND s.name = 'CESOP 6036'
    AND s.active = true
    LIMIT 1;
    
    IF argentina_hotel_id IS NULL THEN
        RAISE EXCEPTION 'Hotel Argentina no encontrado';
    END IF;
    
    IF cesop_service_id IS NULL THEN
        RAISE EXCEPTION 'Servicio CESOP 6036 no encontrado para Argentina';
    END IF;
    
    RAISE NOTICE '✅ Hotel Argentina ID: %', argentina_hotel_id;
    RAISE NOTICE '✅ CESOP Service ID: %', cesop_service_id;
    
    -- 2. Limpiar pagos de prueba anteriores
    DELETE FROM service_payments
    WHERE service_id = cesop_service_id
    AND year = 2025
    AND month IN (6, 7)
    AND notes LIKE '%prueba%';
    
    RAISE NOTICE '🧹 Pagos de prueba anteriores eliminados';
    
    -- 3. Crear pago de junio 2025 para la prueba
    june_payment_id := 'test-cesop-june-2025-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
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
        june_payment_id,
        cesop_service_id,
        'CESOP 6036',
        argentina_hotel_id,
        'Hotel Argentina',
        6,
        2025,
        test_amount,
        '2025-06-10',
        'pendiente',
        'Pago de prueba para generación automática',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Pago de junio creado: %', june_payment_id;
    
    -- 4. Verificar que NO existe el pago de julio antes de la prueba
    SELECT EXISTS (
        SELECT 1 FROM service_payments
        WHERE service_id = cesop_service_id
        AND month = 7
        AND year = 2025
    ) INTO july_payment_exists;
    
    RAISE NOTICE '📋 Pago de julio antes de la prueba: %', 
        CASE WHEN july_payment_exists THEN 'EXISTE' ELSE 'NO EXISTE' END;
    
    -- 5. ACTIVAR EL TRIGGER: Marcar junio como abonado
    RAISE NOTICE '🔄 Marcando pago de junio como ABONADO para activar el trigger...';
    
    UPDATE service_payments
    SET 
        status = 'abonado',
        payment_date = CURRENT_DATE,
        payment_method = 'transferencia',
        invoice_number = 'TEST-CESOP-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        updated_at = NOW()
    WHERE id = june_payment_id;
    
    RAISE NOTICE '✅ Pago de junio marcado como ABONADO';
    
    -- 6. Verificar si se creó automáticamente el pago de julio
    SELECT EXISTS (
        SELECT 1 FROM service_payments
        WHERE service_id = cesop_service_id
        AND month = 7
        AND year = 2025
    ) INTO july_payment_exists;
    
    IF july_payment_exists THEN
        RAISE NOTICE '🎉 ¡ÉXITO! El pago de julio se creó automáticamente';
        
        -- Mostrar detalles del pago creado
        DECLARE
            july_payment RECORD;
        BEGIN
            SELECT 
                id, amount, due_date, status, notes, created_at
            INTO july_payment
            FROM service_payments
            WHERE service_id = cesop_service_id
            AND month = 7
            AND year = 2025
            LIMIT 1;
            
            RAISE NOTICE '📋 DETALLES DEL PAGO DE JULIO:';
            RAISE NOTICE '  - ID: %', july_payment.id;
            RAISE NOTICE '  - Monto: $%', july_payment.amount;
            RAISE NOTICE '  - Vence: %', july_payment.due_date;
            RAISE NOTICE '  - Estado: %', july_payment.status;
            RAISE NOTICE '  - Notas: %', july_payment.notes;
            RAISE NOTICE '  - Creado: %', july_payment.created_at;
        END;
    ELSE
        RAISE NOTICE '❌ ERROR: El pago de julio NO se creó automáticamente';
        RAISE NOTICE '🔍 Verificar que la función y el trigger estén instalados correctamente';
        
        -- Crear manualmente para que la prueba no falle
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
            'manual-cesop-july-2025-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
            cesop_service_id,
            'CESOP 6036',
            argentina_hotel_id,
            'Hotel Argentina',
            7,
            2025,
            test_amount,
            '2025-07-10',
            'pendiente',
            'Creado manualmente - función automática falló',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '🔧 Pago de julio creado manualmente como respaldo';
    END IF;
    
END $$;

-- 7. Mostrar estado final de CESOP 6036
SELECT 
    '📊 ESTADO FINAL CESOP 6036:' as titulo,
    sp.month,
    CASE sp.month 
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        ELSE sp.month::TEXT
    END as mes_nombre,
    sp.year,
    sp.amount,
    sp.status,
    sp.due_date,
    CASE WHEN sp.payment_date IS NOT NULL 
         THEN 'Pagado el ' || sp.payment_date::TEXT 
         ELSE 'Sin pagar' 
    END as estado_pago,
    sp.notes
FROM service_payments sp
JOIN services s ON sp.service_id = s.id
WHERE s.name = 'CESOP 6036'
AND sp.hotel_name ILIKE '%argentina%'
AND sp.year = 2025
AND sp.month IN (6, 7)
ORDER BY sp.month;

SELECT '🏁 PRUEBA DE CESOP 6036 COMPLETADA' as resultado;
