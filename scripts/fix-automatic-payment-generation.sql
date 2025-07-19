-- Arreglar la generación automática de pagos
SELECT 'INSTALANDO FUNCIÓN AUTOMÁTICA DE GENERACIÓN DE PAGOS' as titulo;

-- 1. Eliminar función y trigger existentes
DROP TRIGGER IF EXISTS trigger_auto_generate_payment ON service_payments;
DROP FUNCTION IF EXISTS auto_generate_next_payment();

-- 2. Crear función mejorada
CREATE OR REPLACE FUNCTION auto_generate_next_payment()
RETURNS TRIGGER AS $$
DECLARE
    next_month INTEGER;
    next_year INTEGER;
    next_due_date DATE;
    service_info RECORD;
    hotel_info RECORD;
    payment_exists BOOLEAN;
    new_payment_id TEXT;
BEGIN
    -- Solo procesar cuando el status cambia a 'abonado'
    IF NEW.status = 'abonado' AND (OLD.status IS NULL OR OLD.status != 'abonado') THEN
        
        RAISE NOTICE '🔄 TRIGGER ACTIVADO: Pago marcado como abonado';
        RAISE NOTICE '📋 Servicio: %, Hotel: %, Mes: %/%', 
            NEW.service_name, NEW.hotel_name, NEW.month, NEW.year;
        
        -- Calcular próximo mes y año
        IF NEW.month = 12 THEN
            next_month := 1;
            next_year := NEW.year + 1;
        ELSE
            next_month := NEW.month + 1;
            next_year := NEW.year;
        END IF;
        
        RAISE NOTICE '📅 Próximo período: %/%', next_month, next_year;
        
        -- Obtener información del servicio
        SELECT * INTO service_info
        FROM services
        WHERE id = NEW.service_id;
        
        -- Obtener información del hotel
        SELECT * INTO hotel_info
        FROM hotels
        WHERE id = NEW.hotel_id;
        
        IF service_info.id IS NULL THEN
            RAISE NOTICE '❌ Servicio no encontrado: %', NEW.service_id;
            RETURN NEW;
        END IF;
        
        IF hotel_info.id IS NULL THEN
            RAISE NOTICE '❌ Hotel no encontrado: %', NEW.hotel_id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE '✅ Servicio encontrado: % - Hotel: %', service_info.name, hotel_info.name;
        
        -- Verificar si ya existe el pago del próximo mes
        SELECT EXISTS (
            SELECT 1 FROM service_payments
            WHERE service_id = NEW.service_id
            AND month = next_month
            AND year = next_year
        ) INTO payment_exists;
        
        IF payment_exists THEN
            RAISE NOTICE '⚠️ El pago para %/% ya existe, no se creará duplicado', next_month, next_year;
            RETURN NEW;
        END IF;
        
        -- Calcular fecha de vencimiento (día 10 del próximo mes)
        next_due_date := DATE(next_year || '-' || LPAD(next_month::TEXT, 2, '0') || '-10');
        
        RAISE NOTICE '📆 Fecha de vencimiento: %', next_due_date;
        
        -- Generar ID único para el nuevo pago
        new_payment_id := 'auto-' || NEW.service_id || '-' || next_year || '-' || LPAD(next_month::TEXT, 2, '0') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
        
        -- Crear el nuevo pago
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
            new_payment_id,
            NEW.service_id,
            service_info.name,
            NEW.hotel_id,
            hotel_info.name,
            next_month,
            next_year,
            COALESCE(service_info.average_amount, NEW.amount, 10000),
            next_due_date,
            'pendiente',
            'Generado automáticamente después de pago de ' || NEW.month || '/' || NEW.year,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '🎉 PAGO AUTOMÁTICO CREADO EXITOSAMENTE!';
        RAISE NOTICE '🆔 ID: %', new_payment_id;
        RAISE NOTICE '💰 Monto: $%', COALESCE(service_info.average_amount, NEW.amount, 10000);
        RAISE NOTICE '📅 Vence: %', next_due_date;
        RAISE NOTICE '🏨 Hotel: % - Servicio: %', hotel_info.name, service_info.name;
        
    ELSE
        RAISE NOTICE '⏭️ Trigger omitido: Estado actual %, Estado anterior %', 
            NEW.status, COALESCE(OLD.status, 'NULL');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger
CREATE TRIGGER trigger_auto_generate_payment
    AFTER UPDATE ON service_payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_next_payment();

-- 4. Verificar instalación
SELECT 
    'FUNCIÓN INSTALADA:' as resultado,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_next_payment'
    ) THEN '✅ SÍ' ELSE '❌ NO' END as funcion_existe;

SELECT 
    'TRIGGER INSTALADO:' as resultado,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_generate_payment'
    ) THEN '✅ SÍ' ELSE '❌ NO' END as trigger_existe;

-- 5. Habilitar logging para debug
SET log_min_messages = 'notice';

SELECT '🚀 FUNCIÓN AUTOMÁTICA INSTALADA CORRECTAMENTE' as mensaje;
SELECT 'Ahora cuando marques un pago como "abonado", se generará automáticamente el pago del próximo mes' as instrucciones;
