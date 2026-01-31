-- Crear tablas para Stock Argentina (separadas de las tablas principales de stock)

-- Tabla de productos para Argentina
CREATE TABLE IF NOT EXISTS products_arg (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario para Argentina
CREATE TABLE IF NOT EXISTS inventory_arg (
  product_id INTEGER PRIMARY KEY REFERENCES products_arg(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registros (entradas/salidas) para Argentina
CREATE TABLE IF NOT EXISTS records_arg (
  id BIGSERIAL PRIMARY KEY,
  hotel_id INTEGER,
  hotel_name VARCHAR(255),
  product_id INTEGER REFERENCES products_arg(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  product_unit VARCHAR(50),
  quantity NUMERIC(10, 2) NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida')),
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para las tablas
ALTER TABLE products_arg ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_arg ENABLE ROW LEVEL SECURITY;
ALTER TABLE records_arg ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para products_arg
CREATE POLICY "Allow anonymous select on products_arg" ON products_arg FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on products_arg" ON products_arg FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on products_arg" ON products_arg FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on products_arg" ON products_arg FOR DELETE USING (true);

-- Politicas RLS para inventory_arg
CREATE POLICY "Allow anonymous select on inventory_arg" ON inventory_arg FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on inventory_arg" ON inventory_arg FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on inventory_arg" ON inventory_arg FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on inventory_arg" ON inventory_arg FOR DELETE USING (true);

-- Politicas RLS para records_arg
CREATE POLICY "Allow anonymous select on records_arg" ON records_arg FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on records_arg" ON records_arg FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on records_arg" ON records_arg FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on records_arg" ON records_arg FOR DELETE USING (true);

-- Crear indices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_records_arg_date ON records_arg(date);
CREATE INDEX IF NOT EXISTS idx_records_arg_product_id ON records_arg(product_id);
CREATE INDEX IF NOT EXISTS idx_records_arg_type ON records_arg(type);
CREATE INDEX IF NOT EXISTS idx_records_arg_hotel_name ON records_arg(hotel_name);
