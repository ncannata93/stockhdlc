-- Crear tabla de hoteles
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los hoteles
INSERT INTO hotels (name, code) VALUES 
('Jaguel', 'JAG'),
('Monaco', 'MON'),
('Mallak', 'MAL'),
('Argentina', 'ARG'),
('Falkner', 'FAL'),
('Stromboli', 'STR'),
('San Miguel', 'SMI'),
('Colores', 'COL'),
('Puntarenas', 'PUN'),
('Tupe', 'TUP'),
('Munich', 'MUN'),
('Tiburones', 'TIB'),
('Barlovento', 'BAR'),
('Carama', 'CAR')
ON CONFLICT (name) DO NOTHING;

-- Crear tabla de servicios por hotel
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  average_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, name, provider)
);

-- Crear tabla de pagos de servicios por hotel
CREATE TABLE IF NOT EXISTS service_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, service_id, month, year)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_services_hotel_id ON services(hotel_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_service_payments_hotel_id ON service_payments(hotel_id);
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
CREATE TRIGGER update_hotels_updated_at
BEFORE UPDATE ON hotels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_payments_updated_at
BEFORE UPDATE ON service_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos servicios de ejemplo para diferentes hoteles
DO $$
DECLARE
  hotel_jaguel_id UUID;
  hotel_monaco_id UUID;
  hotel_mallak_id UUID;
BEGIN
  -- Obtener IDs de algunos hoteles
  SELECT id INTO hotel_jaguel_id FROM hotels WHERE name = 'Jaguel';
  SELECT id INTO hotel_monaco_id FROM hotels WHERE name = 'Monaco';
  SELECT id INTO hotel_mallak_id FROM hotels WHERE name = 'Mallak';
  
  -- Insertar servicios para Hotel Jaguel
  INSERT INTO services (hotel_id, name, description, category, provider, account_number, average_amount)
  VALUES 
  (hotel_jaguel_id, 'Electricidad', 'Servicio de electricidad', 'electricidad', 'EDENOR', 'JAG-123456', 15000),
  (hotel_jaguel_id, 'Gas', 'Servicio de gas natural', 'gas', 'Metrogas', 'JAG-789012', 8000),
  (hotel_jaguel_id, 'Agua', 'Servicio de agua potable', 'agua', 'AySA', 'JAG-345678', 5000),
  (hotel_jaguel_id, 'Internet', 'Internet de alta velocidad', 'internet', 'Fibertel', 'JAG-901234', 7500)
  ON CONFLICT (hotel_id, name, provider) DO NOTHING;
  
  -- Insertar servicios para Hotel Monaco
  INSERT INTO services (hotel_id, name, description, category, provider, account_number, average_amount)
  VALUES 
  (hotel_monaco_id, 'Electricidad', 'Servicio de electricidad', 'electricidad', 'EDENOR', 'MON-123456', 18000),
  (hotel_monaco_id, 'Gas', 'Servicio de gas natural', 'gas', 'Metrogas', 'MON-789012', 9500),
  (hotel_monaco_id, 'Agua', 'Servicio de agua potable', 'agua', 'AySA', 'MON-345678', 6000),
  (hotel_monaco_id, 'Internet', 'Internet de alta velocidad', 'internet', 'Fibertel', 'MON-901234', 8500)
  ON CONFLICT (hotel_id, name, provider) DO NOTHING;
  
  -- Insertar servicios para Hotel Mallak
  INSERT INTO services (hotel_id, name, description, category, provider, account_number, average_amount)
  VALUES 
  (hotel_mallak_id, 'Electricidad', 'Servicio de electricidad', 'electricidad', 'EDENOR', 'MAL-123456', 12000),
  (hotel_mallak_id, 'Gas', 'Servicio de gas natural', 'gas', 'Metrogas', 'MAL-789012', 7000),
  (hotel_mallak_id, 'Agua', 'Servicio de agua potable', 'agua', 'AySA', 'MAL-345678', 4500),
  (hotel_mallak_id, 'Internet', 'Internet de alta velocidad', 'internet', 'Fibertel', 'MAL-901234', 6500)
  ON CONFLICT (hotel_id, name, provider) DO NOTHING;
END $$;
