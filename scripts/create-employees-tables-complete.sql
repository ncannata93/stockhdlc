-- Crear tabla de empleados si no existe
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Mantenimiento',
    daily_rate DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de asignaciones si no existe
CREATE TABLE IF NOT EXISTS employee_assignments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    hotel_name VARCHAR(255) NOT NULL,
    assignment_date DATE NOT NULL,
    daily_rate_used DECIMAL(10,2),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS employee_payments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    week_start DATE,
    week_end DATE,
    status VARCHAR(50) DEFAULT 'pendiente',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_id ON employee_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_date ON employee_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_hotel ON employee_assignments(hotel_name);

CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_date ON employee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);

-- Insertar algunos empleados de ejemplo si la tabla está vacía
INSERT INTO employees (name, role, daily_rate) 
SELECT 'Juan Pérez', 'Mantenimiento', 50000
WHERE NOT EXISTS (SELECT 1 FROM employees);

INSERT INTO employees (name, role, daily_rate) 
SELECT 'María García', 'Limpieza', 45000
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE name = 'María García');

INSERT INTO employees (name, role, daily_rate) 
SELECT 'Carlos López', 'Mantenimiento', 55000
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Carlos López');

-- Verificar que las tablas se crearon correctamente
SELECT 'Tabla employees creada' as status, count(*) as registros FROM employees
UNION ALL
SELECT 'Tabla employee_assignments creada' as status, count(*) as registros FROM employee_assignments
UNION ALL
SELECT 'Tabla employee_payments creada' as status, count(*) as registros FROM employee_payments;
