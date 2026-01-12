-- Agregar columna payment_method a la tabla service_payments
DO $$ 
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'service_payments' 
        AND column_name = 'payment_method'
    ) THEN
        -- Agregar la columna payment_method
        ALTER TABLE service_payments 
        ADD COLUMN payment_method TEXT;
        
        RAISE NOTICE 'Columna payment_method agregada exitosamente a service_payments';
    ELSE
        RAISE NOTICE 'La columna payment_method ya existe en service_payments';
    END IF;
END $$;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'service_payments' 
ORDER BY ordinal_position;
