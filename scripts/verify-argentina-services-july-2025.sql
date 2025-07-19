-- Verificar todos los servicios de Argentina y sus períodos activos
SELECT 
    s.name as service_name,
    s.id as service_id,
    s.active,
    MIN(sp.month || '/' || sp.year) as primer_pago,
    MAX(sp.month || '/' || sp.year) as ultimo_pago,
    COUNT(*) as total_pagos,
    COUNT(CASE WHEN sp.month = 7 AND sp.year = 2025 THEN 1 END) as pagos_julio_2025
FROM services s
LEFT JOIN service_payments sp ON s.id = sp.service_id
WHERE s.hotel_id = '4'  -- Argentina
GROUP BY s.id, s.name, s.active
ORDER BY s.name;

-- Verificar específicamente Julio 2025 para Argentina
SELECT 
    sp.service_name,
    sp.month,
    sp.year,
    sp.amount,
    sp.status,
    sp.created_at
FROM service_payments sp
WHERE sp.hotel_id = '4'  -- Argentina
  AND sp.month = 7 
  AND sp.year = 2025
ORDER BY sp.service_name;

-- Verificar qué servicios estaban activos en Junio vs Agosto 2025
SELECT 
    'Junio 2025' as periodo,
    sp.service_name,
    COUNT(*) as cantidad
FROM service_payments sp
WHERE sp.hotel_id = '4' 
  AND sp.month = 6 
  AND sp.year = 2025
GROUP BY sp.service_name

UNION ALL

SELECT 
    'Julio 2025' as periodo,
    sp.service_name,
    COUNT(*) as cantidad
FROM service_payments sp
WHERE sp.hotel_id = '4' 
  AND sp.month = 7 
  AND sp.year = 2025
GROUP BY sp.service_name

UNION ALL

SELECT 
    'Agosto 2025' as periodo,
    sp.service_name,
    COUNT(*) as cantidad
FROM service_payments sp
WHERE sp.hotel_id = '4' 
  AND sp.month = 8 
  AND sp.year = 2025
GROUP BY sp.service_name

ORDER BY periodo, service_name;
