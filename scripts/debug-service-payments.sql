-- Script para debuggear pagos de servicios
-- Verificar si existen tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_payments', 'hotels', 'services');

-- Verificar estructura de la tabla service_payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_payments'
ORDER BY ordinal_position;

-- Contar todos los pagos
SELECT COUNT(*) as total_payments FROM service_payments;

-- Contar pagos por mes
SELECT month, year, COUNT(*) as count
FROM service_payments
GROUP BY month, year
ORDER BY year, month;

-- Mostrar todos los pagos de enero y febrero 2025
SELECT id, service_name, hotel_id, month, year, amount, status, created_at
FROM service_payments
WHERE (month = 1 OR month = 2) AND year = 2025
ORDER BY month, created_at;

-- Verificar si hay hoteles
SELECT COUNT(*) as total_hotels FROM hotels;

-- Mostrar algunos hoteles
SELECT id, name FROM hotels LIMIT 5;

-- Verificar si hay servicios
SELECT COUNT(*) as total_services FROM services;

-- Mostrar algunos servicios
SELECT id, name FROM services LIMIT 5;
