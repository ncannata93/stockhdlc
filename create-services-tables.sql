-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  average_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos de servicios
CREATE TABLE IF NOT EXISTS service_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  invoice_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_payments_service_id ON service_payments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_status ON service_payments(status);
CREATE INDEX IF NOT EXISTS idx_service_payments_month_year ON service_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_service_payments_due_date ON service_payments(due_date);

-- Crear función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_payments_updated_at
BEFORE UPDATE ON service_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos servicios de ejemplo
INSERT INTO services (name, description, category, provider, account_number, average_amount)
VALUES 
('Electricidad', 'Servicio de electricidad del hotel', 'electricidad', 'EDENOR', '123456789', 15000),
('Gas', 'Servicio de gas natural', 'gas', 'Metrogas', '987654321', 8000),
('Agua', 'Servicio de agua potable', 'agua', 'AySA', '456789123', 5000),
('Internet', 'Servicio de internet de alta velocidad', 'internet', 'Fibertel', '789123456', 7500),
('Teléfono', 'Línea telefónica fija', 'telefono', 'Telecom', '321654987', 3000)
ON CONFLICT (id) DO NOTHING;
