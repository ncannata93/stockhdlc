-- Crear tabla simple para semanas pagadas
CREATE TABLE IF NOT EXISTS paid_weeks (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, week_start, week_end)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_paid_weeks_employee ON paid_weeks(employee_id);
CREATE INDEX IF NOT EXISTS idx_paid_weeks_dates ON paid_weeks(week_start, week_end);
