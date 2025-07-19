-- Diagnóstico completo para Argentina Enero 2025
-- Este script verifica por qué no aparecen los pagos de Argentina

-- 1. Verificar hoteles existentes
SELECT 'HOTELES EXISTENTES' as seccion;
SELECT id, name, code, active FROM hotels ORDER BY name;

-- 2. Verificar específicamente el hotel Argentina
SELECT 'HOTEL ARGENTINA' as seccion;
SELECT * FROM hotels WHERE name ILIKE '%argentina%';

-- 3. Verificar servicios de Argentina
SELECT 'SERVICIOS DE ARGENTINA' as seccion;
SELECT s.id, s.name, s.hotel_id, h.name as hotel_name
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%';

-- 4. Contar pagos totales
SELECT 'TOTAL PAGOS' as seccion;
SELECT COUNT(*) as total_pagos FROM service_payments;

-- 5. Verificar pagos de Argentina enero 2025 - CONSULTA DIRECTA
SELECT 'PAGOS ARGENTINA ENERO 2025 - DIRECTO' as seccion;
SELECT 
    sp.id,
    sp.service_name,
    sp.hotel_id,
    h.name as hotel_name,
    sp.month,
    sp.year,
    sp.amount,
    sp.status,
    sp.due_date,
    sp.payment_date,
    sp.created_at
FROM service_payments sp
JOIN hotels h ON sp.hotel_id = h.id
WHERE h.name = 'Argentina' 
    AND sp.month = 1 
    AND sp.year = 2025
ORDER BY sp.created_at DESC;

-- 6. Verificar todos los pagos de enero 2025
SELECT 'TODOS LOS PAGOS ENERO 2025' as seccion;
SELECT 
    sp.id,
    sp.service_name,
    sp.hotel_id,
    h.name as hotel_name,
    sp.month,
    sp.year,
    sp.amount,
    sp.status
FROM service_payments sp
JOIN hotels h ON sp.hotel_id = h.id
WHERE sp.month = 1 AND sp.year = 2025
ORDER BY h.name, sp.service_name;

-- 7. Verificar si hay pagos con hotel_id = '4' (Argentina)
SELECT 'PAGOS CON HOTEL_ID 4 (ARGENTINA)' as seccion;
SELECT 
    sp.id,
    sp.service_name,
    sp.hotel_id,
    sp.month,
    sp.year,
    sp.amount,
    sp.status,
    sp.created_at
FROM service_payments sp
WHERE sp.hotel_id = '4' 
    AND sp.month = 1 
    AND sp.year = 2025
ORDER BY sp.created_at DESC;
