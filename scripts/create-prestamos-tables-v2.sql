-- Verificar si las tablas existen antes de crearlas
DO $$
BEGIN
    -- Crear tabla de hoteles si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hoteles') THEN
        CREATE TABLE hoteles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE,
            direccion TEXT,
            telefono VARCHAR(50),
            email VARCHAR(255),
            activo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla hoteles creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla hoteles ya existe';
    END IF;

    -- Crear tabla de préstamos si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prestamos') THEN
        CREATE TABLE prestamos (
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
        
        RAISE NOTICE 'Tabla prestamos creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla prestamos ya existe';
    END IF;
END $$;

-- Crear índices para optimizar consultas (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha ON prestamos(fecha);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_origen ON prestamos(hotel_origen);
CREATE INDEX IF NOT EXISTS idx_prestamos_hotel_destino ON prestamos(hotel_destino);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_responsable ON prestamos(responsable);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_vencimiento ON prestamos(fecha_vencimiento);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers (eliminar si existen y recrear)
DROP TRIGGER IF EXISTS update_prestamos_updated_at ON prestamos;
CREATE TRIGGER update_prestamos_updated_at
    BEFORE UPDATE ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Insertar préstamos de ejemplo si la tabla está vacía
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM prestamos) = 0 THEN
        INSERT INTO prestamos (fecha, hotel_origen, hotel_destino, concepto, monto, responsable, estado, fecha_vencimiento, notas)
        VALUES 
            ('2024-01-15', 'Monaco', 'Mallak', 'Préstamo para reparaciones urgentes', 50000.00, 'Juan Manuel', 'pendiente', '2024-02-15', 'Reparación de sistema de calefacción'),
            ('2024-01-20', 'Argentina', 'Colores', 'Compra de suministros de limpieza', 25000.00, 'Diego', 'pagado', '2024-02-20', 'Productos químicos para piscina'),
            ('2024-01-25', 'Falkner', 'Stromboli', 'Préstamo de emergencia', 75000.00, 'Nacho', 'pendiente', '2024-03-01', 'Emergencia por corte de luz'),
            ('2024-02-01', 'Jaguel', 'Monaco', 'Equipamiento de cocina', 120000.00, 'Juan Manuel', 'cancelado', '2024-03-01', 'Compra cancelada por proveedor'),
            ('2024-02-05', 'Colores', 'Argentina', 'Préstamo para marketing', 30000.00, 'Daniela', 'pendiente', '2024-03-05', 'Campaña publicitaria temporada alta'),
            ('2024-02-10', 'Stromboli', 'Falkner', 'Mantenimiento piscina', 45000.00, 'Nacho', 'pagado', '2024-03-10', 'Reparación bomba de agua');
        
        RAISE NOTICE 'Datos de ejemplo insertados en prestamos';
    ELSE
        RAISE NOTICE 'La tabla prestamos ya contiene datos';
    END IF;
END $$;

-- Habilitar RLS (Row Level Security)
ALTER TABLE hoteles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de RLS (permitir todo por ahora)
DROP POLICY IF EXISTS "Allow all operations on hoteles" ON hoteles;
CREATE POLICY "Allow all operations on hoteles" ON hoteles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on prestamos" ON prestamos;
CREATE POLICY "Allow all operations on prestamos" ON prestamos
    FOR ALL USING (true) WITH CHECK (true);

-- Verificar que todo se creó correctamente
DO $$
DECLARE
    hoteles_count INTEGER;
    prestamos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO hoteles_count FROM hoteles;
    SELECT COUNT(*) INTO prestamos_count FROM prestamos;
    
    RAISE NOTICE '=== RESUMEN DE CREACIÓN ===';
    RAISE NOTICE 'Hoteles en la base de datos: %', hoteles_count;
    RAISE NOTICE 'Préstamos en la base de datos: %', prestamos_count;
    RAISE NOTICE 'Sistema de préstamos configurado exitosamente';
END $$;
