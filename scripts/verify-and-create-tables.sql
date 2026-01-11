-- Verificar y crear todas las tablas necesarias para el sistema de empleados

-- 1. Crear tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Mantenimiento',
  daily_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear tabla de asignaciones
CREATE TABLE IF NOT EXISTS employee_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  assignment_date DATE NOT NULL,
  daily_rate_used NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- 3. Crear tabla de pagos
CREATE TABLE IF NOT EXISTS employee_payments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  payment_date DATE NOT NULL,
  week_start DATE,
  week_end DATE,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_id ON employee_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_date ON employee_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_date ON employee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);

-- 5. Verificar que las tablas se crearon correctamente
SELECT 
  'employees' as tabla,
  COUNT(*) as registros
FROM employees
UNION ALL
SELECT 
  'employee_assignments' as tabla,
  COUNT(*) as registros
FROM employee_assignments
UNION ALL
SELECT 
  'employee_payments' as tabla,
  COUNT(*) as registros
FROM employee_payments;

-- 6. Mostrar estructura de las tablas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('employees', 'employee_assignments', 'employee_payments')
ORDER BY table_name, ordinal_position;
