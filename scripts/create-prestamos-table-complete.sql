-- Eliminar tabla existente si existe (para recrear con estructura correcta)
DROP TABLE IF EXISTS prestamos CASCADE;

-- Crear tabla de préstamos con estructura completa
CREATE TABLE IF NOT EXISTS prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  responsable TEXT NOT NULL,
  hotel_origen TEXT NOT NULL,
  hotel_destino TEXT NOT NULL,
  producto TEXT NOT NULL,
  cantidad TEXT,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha ON prestamos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_origen ON prestamos(hotel_origen);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_destino ON prestamos(hotel_destino);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_responsable ON prestamos(responsable);
CREATE INDEX IF NOT EXISTS idx_prestamos_created_at ON prestamos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prestamos_valor ON prestamos(valor);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_prestamos_updated_at ON prestamos;
CREATE TRIGGER update_prestamos_updated_at
  BEFORE UPDATE ON prestamos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all prestamos" ON prestamos;
DROP POLICY IF EXISTS "Users can insert prestamos" ON prestamos;
DROP POLICY IF EXISTS "Users can update prestamos" ON prestamos;
DROP POLICY IF EXISTS "Users can delete prestamos" ON prestamos;

-- Políticas de seguridad más permisivas para desarrollo
CREATE POLICY IF NOT EXISTS "Usuarios pueden ver prestamos" ON prestamos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios pueden crear prestamos" ON prestamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios pueden actualizar prestamos" ON prestamos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios pueden eliminar prestamos" ON prestamos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insertar algunos datos de ejemplo para pruebas
INSERT INTO prestamos (responsable, hotel_origen, hotel_destino, producto, cantidad, valor, notas, estado) VALUES
('Nicolas Cannata', 'Argentina', 'Mallak', 'Toallas', '20 unidades', 50000, 'Préstamo para reposición de toallas', 'pendiente'),
('Diego Pili', 'Mallak', 'Monaco', 'Equipamiento', '5 items', 30000, 'Equipamiento de cocina', 'pendiente'),
('Juan Prey', 'Jaguel', 'Argentina', 'Materiales', '10 kg', 75000, 'Materiales de construcción', 'pagado'),
('Nicolas Cannata', 'Mallak', 'Argentina', 'Efectivo', '1', 15000, 'Préstamo en efectivo', 'pendiente'),
('Diego Pili', 'Monaco', 'Jaguel', 'Productos limpieza', '25 unidades', 40000, 'Productos de limpieza', 'cancelado');

-- Verificar que la tabla se creó correctamente
SELECT 
  'Tabla creada exitosamente' as status,
  COUNT(*) as total_registros
FROM prestamos;

-- Mostrar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'prestamos' 
ORDER BY ordinal_position;
