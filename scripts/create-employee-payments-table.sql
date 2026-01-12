-- Crear tabla de pagos de empleados si no existe
CREATE TABLE IF NOT EXISTS employee_payments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'cancelado')),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_payment_date ON employee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);
CREATE INDEX IF NOT EXISTS idx_employee_payments_week_range ON employee_payments(week_start, week_end);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employee_payments_updated_at ON employee_payments;
CREATE TRIGGER update_employee_payments_updated_at
    BEFORE UPDATE ON employee_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la tabla se creó correctamente
SELECT 
    'employee_payments' as tabla,
    COUNT(*) as registros_existentes,
    'Tabla creada exitosamente' as estado
FROM employee_payments;
