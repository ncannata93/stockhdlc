-- Crear tabla de hoteles si no existe
CREATE TABLE IF NOT EXISTS hoteles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL,
    hotel_origen VARCHAR(255) NOT NULL,
    hotel_destino VARCHAR(255) NOT NULL,
    concepto TEXT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
    fecha_vencimiento DATE,
    fecha_pago DATE,
    metodo_pago VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha ON prestamos(fecha);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_origen ON prestamos(hotel_origen);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_destino ON prestamos(hotel_destino);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_responsable ON prestamos(responsable);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_vencimiento ON prestamos(fecha_vencimiento);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a la tabla prestamos
DROP TRIGGER IF EXISTS update_prestamos_updated_at ON prestamos;
CREATE TRIGGER update_prestamos_updated_at
    BEFORE UPDATE ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a la tabla hoteles
DROP TRIGGER IF EXISTS update_hoteles_updated_at ON hoteles;
CREATE TRIGGER update_hoteles_updated_at
    BEFORE UPDATE ON hoteles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar hoteles de ejemplo si no existen
INSERT INTO hoteles (nombre, direccion, telefono, email, activo) 
VALUES 
    ('Monaco', 'Av. Principal 123', '+54 11 1234-5678', 'monaco@hotelescosta.com', true),
    ('Mallak', 'Calle Central 456', '+54 11 2345-6789', 'mallak@hotelescosta.com', true),
    ('Argentina', 'Boulevard Norte 789', '+54 11 3456-7890', 'argentina@hotelescosta.com', true),
    ('Colores', 'Paseo Sur 321', '+54 11 4567-8901', 'colores@hotelescosta.com', true),
    ('Falkner', 'Avenida Este 654', '+54 11 5678-9012', 'falkner@hotelescosta.com', true),
    ('Stromboli', 'Calle Oeste 987', '+54 11 6789-0123', 'stromboli@hotelescosta.com', true),
    ('Jaguel', 'Plaza Central 147', '+54 11 7890-1234', 'jaguel@hotelescosta.com', true)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar préstamos de ejemplo si no existen
INSERT INTO prestamos (fecha, hotel_origen, hotel_destino, concepto, monto, responsable, estado, fecha_vencimiento, notas)
VALUES 
    ('2024-01-15', 'Monaco', 'Mallak', 'Préstamo para reparaciones urgentes', 50000.00, 'Juan Manuel', 'pendiente', '2024-02-15', 'Reparación de sistema de calefacción'),
    ('2024-01-20', 'Argentina', 'Colores', 'Compra de suministros de limpieza', 25000.00, 'Diego', 'pagado', '2024-02-20', 'Productos químicos para piscina'),
    ('2024-01-25', 'Falkner', 'Stromboli', 'Préstamo de emergencia', 75000.00, 'Nacho', 'pendiente', '2024-03-01', 'Emergencia por corte de luz'),
    ('2024-02-01', 'Jaguel', 'Monaco', 'Equipamiento de cocina', 120000.00, 'Juan Manuel', 'cancelado', '2024-03-01', 'Compra cancelada por proveedor')
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security) si está disponible
ALTER TABLE hoteles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de RLS (permitir todo por ahora)
DROP POLICY IF EXISTS "Allow all operations on hoteles" ON hoteles;
CREATE POLICY "Allow all operations on hoteles" ON hoteles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on prestamos" ON prestamos;
CREATE POLICY "Allow all operations on prestamos" ON prestamos
    FOR ALL USING (true) WITH CHECK (true);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tablas de préstamos creadas exitosamente con datos de ejemplo';
END $$;
