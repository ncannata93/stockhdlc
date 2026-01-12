-- Crear función que genera automáticamente el siguiente pago cuando se marca uno como abonado
CREATE OR REPLACE FUNCTION generate_next_payment_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    next_month INTEGER;
    next_year INTEGER;
    service_record RECORD;
    new_due_date DATE;
BEGIN
    -- Solo ejecutar cuando el status cambia a 'abonado'
    IF NEW.status = 'abonado' AND (OLD.status IS NULL OR OLD.status != 'abonado') THEN
        
        -- Obtener información del servicio
        SELECT * INTO service_record 
        FROM services 
        WHERE id = NEW.service_id AND active = true;
        
        -- Si el servicio existe y está activo
        IF FOUND THEN
            -- Calcular el siguiente mes/año
            IF NEW.month = 12 THEN
                next_month := 1;
                next_year := NEW.year + 1;
            ELSE
                next_month := NEW.month + 1;
                next_year := NEW.year;
            END IF;
            
            -- Calcular fecha de vencimiento (día 10 del mes)
            new_due_date := DATE(next_year || '-' || LPAD(next_month::TEXT, 2, '0') || '-10');
            
            -- Verificar si ya existe un pago para el siguiente mes
            IF NOT EXISTS (
                SELECT 1 FROM service_payments 
                WHERE service_id = NEW.service_id 
                    AND month = next_month 
                    AND year = next_year
            ) THEN
                -- Crear el siguiente pago
                INSERT INTO service_payments (
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
                    NEW.service_id,
                    NEW.service_name,
                    NEW.hotel_id,
                    NEW.hotel_name,
                    next_month,
                    next_year,
                    COALESCE(service_record.average_amount, NEW.amount),
                    new_due_date,
                    'pendiente',
                    'Generado automáticamente después de pago',
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Pago automático generado para % - %/%', NEW.service_name, next_month, next_year;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS auto_generate_next_payment ON service_payments;
CREATE TRIGGER auto_generate_next_payment
    AFTER UPDATE ON service_payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_next_payment_on_payment();

-- También crear trigger para INSERT (cuando se crea un pago ya abonado)
DROP TRIGGER IF EXISTS auto_generate_next_payment_insert ON service_payments;
CREATE TRIGGER auto_generate_next_payment_insert
    AFTER INSERT ON service_payments
    FOR EACH ROW
    WHEN (NEW.status = 'abonado')
    EXECUTE FUNCTION generate_next_payment_on_payment();

SELECT 'FUNCIÓN Y TRIGGERS CREADOS EXITOSAMENTE' as resultado;
