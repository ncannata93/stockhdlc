-- Crear tabla de empleados si no existe
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  daily_rate NUMERIC DEFAULT 0
);

-- Crear tabla de asignaciones si no existe
CREATE TABLE IF NOT EXISTS employee_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  hotel_name TEXT,
  assignment_date DATE,
  daily_rate_used NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS employee_payments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  amount NUMERIC DEFAULT 0,
  payment_date DATE,
  week_start DATE,
  week_end DATE,
  status TEXT DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- Agregar columna daily_rate_used si no existe
ALTER TABLE employee_assignments ADD COLUMN IF NOT EXISTS daily_rate_used NUMERIC DEFAULT 0;

-- Actualizar los registros existentes con la tarifa actual del empleado
UPDATE employee_assignments a
SET daily_rate_used = e.daily_rate
FROM employees e
WHERE a.employee_id = e.id AND a.daily_rate_used = 0;

-- Mostrar estructura de las tablas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'employee_assignments', 'employee_payments')
ORDER BY table_name, ordinal_position;
