-- Limpiar y recrear las tablas de empleados correctamente

-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS employee_payments CASCADE;
DROP TABLE IF EXISTS employee_assignments CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Crear tabla de empleados
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Mantenimiento',
    daily_rate DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de asignaciones
CREATE TABLE employee_assignments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    hotel_name VARCHAR(100) NOT NULL,
    assignment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Crear tabla de pagos
CREATE TABLE employee_payments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    week_start DATE,
    week_end DATE,
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_employee_assignments_employee_id ON employee_assignments(employee_id);
CREATE INDEX idx_employee_assignments_date ON employee_assignments(assignment_date);
CREATE INDEX idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX idx_employee_payments_date ON employee_payments(payment_date);
CREATE INDEX idx_employee_payments_status ON employee_payments(status);

-- Insertar algunos empleados de ejemplo (opcional)
INSERT INTO employees (name, role, daily_rate) VALUES
('Juan Pérez', 'Mantenimiento', 15000),
('María García', 'Limpieza', 12000),
('Carlos López', 'Electricista', 18000);

COMMIT;
