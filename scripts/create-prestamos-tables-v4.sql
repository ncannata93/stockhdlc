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
    hotel_origen VARCHAR(255) NOT NULL,
    hotel_destino VARCHAR(255) NOT NULL,
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

-- Insertar préstamos de ejemplo
INSERT INTO prestamos (fecha, responsable, hotel_origen, hotel_destino, producto, cantidad, valor) VALUES
('2024-01-15', 'Juan Manuel', 'Mallak', 'Argentina', 'Toallas', '20 unidades', 15000.00),
('2024-01-16', 'Diego', 'Monaco', 'Jaguel', 'Sábanas', '15 juegos', 25000.00),
('2024-01-17', 'Nacho', 'Argentina', 'Falkner', 'Productos de limpieza', '10 cajas', 8000.00),
('2024-01-18', 'Juan Pablo', 'Tupe', 'Munich', 'Efectivo', '$50000', 50000.00),
('2024-01-19', 'Diego', 'Stromboli', 'Colores', 'Amenities', '30 sets', 12000.00),
('2024-01-20', 'Nacho', 'Puntarenas', 'Tiburones', 'Mantelería', '25 juegos', 18000.00),
('2024-01-21', 'Juan Manuel', 'Barlovento', 'San Miguel', 'Toallas de playa', '40 unidades', 22000.00),
('2024-01-22', 'Juan Pablo', 'Carama', 'Jaguel', 'Productos de baño', '20 sets', 9500.00);

-- Crear índices para optimizar consultas
CREATE INDEX idx_prestamos_fecha ON prestamos(fecha);
CREATE INDEX idx_prestamos_hotel_origen ON prestamos(hotel_origen);
CREATE INDEX idx_prestamos_hotel_destino ON prestamos(hotel_destino);
CREATE INDEX idx_prestamos_responsable ON prestamos(responsable);

-- Habilitar RLS (Row Level Security)
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoteles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir todo por ahora)
CREATE POLICY "Permitir todo en prestamos" ON prestamos FOR ALL USING (true);
CREATE POLICY "Permitir todo en hoteles" ON hoteles FOR ALL USING (true);
