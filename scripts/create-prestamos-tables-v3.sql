-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS hoteles CASCADE;

-- Crear tabla de hoteles
CREATE TABLE hoteles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de préstamos
CREATE TABLE prestamos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    responsable VARCHAR(255) NOT NULL,
    hotel_retira VARCHAR(255) NOT NULL,
    hotel_recibe VARCHAR(255) NOT NULL,
    producto TEXT NOT NULL,
    cantidad VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar hoteles en el orden especificado
INSERT INTO hoteles (nombre) VALUES
('Jaguel'),
('Monaco'),
('Mallak'),
('Argentina'),
('Falkner'),
('Stromboli'),
('San Miguel'),
('Colores'),
('Puntarenas'),
('Tupe'),
('Munich'),
('Tiburones'),
('Barlovento'),
('Carama');

-- Insertar datos de ejemplo
INSERT INTO prestamos (fecha, responsable, hotel_retira, hotel_recibe, producto, cantidad, valor) VALUES
('2024-01-15', 'Juan Manuel', 'Mallak', 'Argentina', 'Toallas', '20 unidades', 15000.00),
('2024-01-16', 'Diego', 'Monaco', 'Jaguel', 'Sábanas', '15 juegos', 25000.00),
('2024-01-17', 'Nacho', 'Argentina', 'Falkner', 'Productos de limpieza', '5 cajas', 8000.00),
('2024-01-18', 'Juan Manuel', 'Stromboli', 'San Miguel', 'Almohadas', '30 unidades', 12000.00),
('2024-01-19', 'Diego', 'Colores', 'Puntarenas', 'Mantenimiento', '1 servicio', 35000.00),
('2024-01-20', 'Nacho', 'Tupe', 'Munich', 'Efectivo', '$50000', 50000.00),
('2024-01-21', 'Juan Manuel', 'Tiburones', 'Barlovento', 'Servicios', '2 servicios', 18000.00),
('2024-01-22', 'Diego', 'Carama', 'Mallak', 'Toallas', '10 unidades', 7500.00);

-- Crear índices para optimizar consultas
CREATE INDEX idx_prestamos_fecha ON prestamos(fecha);
CREATE INDEX idx_prestamos_responsable ON prestamos(responsable);
CREATE INDEX idx_prestamos_hotel_retira ON prestamos(hotel_retira);
CREATE INDEX idx_prestamos_hotel_recibe ON prestamos(hotel_recibe);

-- Habilitar RLS (Row Level Security)
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoteles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir todo por ahora)
CREATE POLICY "Allow all operations on prestamos" ON prestamos FOR ALL USING (true);
CREATE POLICY "Allow all operations on hoteles" ON hoteles FOR ALL USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en prestamos
CREATE TRIGGER update_prestamos_updated_at 
    BEFORE UPDATE ON prestamos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
