-- Crear tabla de empleados si no existe
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  daily_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de asignaciones si no existe
CREATE TABLE IF NOT EXISTS employee_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  hotel_name TEXT,
  assignment_date DATE,
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
