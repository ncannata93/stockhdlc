-- Crear tabla de préstamos en Supabase
CREATE TABLE IF NOT EXISTS prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  responsable TEXT NOT NULL,
  hotel_origen TEXT NOT NULL,
  hotel_destino TEXT NOT NULL,
  producto TEXT NOT NULL,
  cantidad TEXT,
  valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
  notas TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT different_hotels CHECK (hotel_origen != hotel_destino)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha ON prestamos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_origen ON prestamos(hotel_origen);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_destino ON prestamos(hotel_destino);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_responsable ON prestamos(responsable);
CREATE INDEX IF NOT EXISTS idx_prestamos_created_at ON prestamos(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_prestamos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_prestamos_updated_at ON prestamos;
CREATE TRIGGER trigger_update_prestamos_updated_at
  BEFORE UPDATE ON prestamos
  FOR EACH ROW
  EXECUTE FUNCTION update_prestamos_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios autenticados pueden ver todos los préstamos
CREATE POLICY "Users can view all prestamos" ON prestamos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Los usuarios autenticados pueden insertar préstamos
CREATE POLICY "Users can insert prestamos" ON prestamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar préstamos que crearon o si son admin
CREATE POLICY "Users can update own prestamos" ON prestamos
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Los usuarios pueden eliminar préstamos que crearon o si son admin
CREATE POLICY "Users can delete own prestamos" ON prestamos
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insertar algunos datos de ejemplo
INSERT INTO prestamos (responsable, hotel_origen, hotel_destino, producto, cantidad, valor, notas) VALUES
('Nicolas Cannata', 'Argentina', 'Mallak', 'Toallas', '20 unidades', 50000, 'Préstamo para reposición de toallas'),
('Diego Pili', 'Mallak', 'Monaco', 'Equipamiento', '5 items', 30000, 'Equipamiento de cocina'),
('Juan Prey', 'Jaguel', 'Argentina', 'Materiales', '10 kg', 75000, 'Materiales de construcción'),
('Nicolas Cannata', 'Mallak', 'Argentina', 'Efectivo', '1', 15000, 'Préstamo en efectivo'),
('Diego Pili', 'Monaco', 'Jaguel', 'Productos limpieza', '25 unidades', 40000, 'Productos de limpieza');

-- Comentarios para documentación
COMMENT ON TABLE prestamos IS 'Tabla para gestionar préstamos entre hoteles';
COMMENT ON COLUMN prestamos.id IS 'Identificador único del préstamo';
COMMENT ON COLUMN prestamos.fecha IS 'Fecha del préstamo';
COMMENT ON COLUMN prestamos.responsable IS 'Persona responsable del préstamo';
COMMENT ON COLUMN prestamos.hotel_origen IS 'Hotel que otorga el préstamo';
COMMENT ON COLUMN prestamos.hotel_destino IS 'Hotel que recibe el préstamo';
COMMENT ON COLUMN prestamos.producto IS 'Descripción del producto o concepto';
COMMENT ON COLUMN prestamos.cantidad IS 'Cantidad del producto (texto libre)';
COMMENT ON COLUMN prestamos.valor IS 'Valor monetario del préstamo';
COMMENT ON COLUMN prestamos.estado IS 'Estado del préstamo: pendiente, pagado, cancelado';
COMMENT ON COLUMN prestamos.created_by IS 'Usuario que creó el registro';
