-- Crear tabla employee_payments si no existe
CREATE TABLE IF NOT EXISTS employee_payments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    week_start DATE,
    week_end DATE,
    status VARCHAR(20) DEFAULT 'pendiente',
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);
CREATE INDEX IF NOT EXISTS idx_employee_payments_dates ON employee_payments(week_start, week_end);

-- Crear foreign key constraint si la tabla employees existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        -- Intentar agregar la foreign key constraint
        BEGIN
            ALTER TABLE employee_payments 
            ADD CONSTRAINT fk_employee_payments_employee_id 
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN
                -- La constraint ya existe, no hacer nada
                NULL;
        END;
    END IF;
END $$;

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_payments'
ORDER BY ordinal_position;

-- Mostrar información de la tabla
SELECT 
    'employee_payments' as table_name,
    COUNT(*) as row_count
FROM employee_payments;
