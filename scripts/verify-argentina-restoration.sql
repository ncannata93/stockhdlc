-- Verificar que la restauración de Argentina fue exitosa
SELECT 'VERIFICANDO RESTAURACIÓN DE ARGENTINA' as titulo;

-- 1. Verificar hotel
SELECT 
    'HOTEL ARGENTINA:' as seccion,
    h.id,
    h.name,
    h.address,
    h.phone
FROM hotels h
WHERE h.name ILIKE '%argentina%';

-- 2. Verificar servicios
SELECT 
    'SERVICIOS DE ARGENTINA:' as seccion,
    COUNT(*) as total_servicios,
    COUNT(CASE WHEN active = true THEN 1 END) as activos,
    SUM(average_amount) as monto_mensual_total
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%';

-- 3. Listar todos los servicios
SELECT 
    'Lista de servicios:' as detalle,
    s.name,
    s.category,
    s.provider,
    s.average_amount,
    s.active
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%'
ORDER BY s.name;

-- 4. Verificar pagos por mes en 2025
SELECT 
    'PAGOS 2025 POR MES:' as distribucion,
    sp.month,
    CASE sp.month 
        WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
    END as mes_nombre,
    COUNT(*) as cantidad_pagos,
    SUM(sp.amount) as monto_total
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
AND sp.year = 2025
GROUP BY sp.month
ORDER BY sp.month;

-- 5. Verificar estado de pagos
SELECT 
    'ESTADO DE PAGOS:' as estados,
    sp.status,
    COUNT(*) as cantidad,
    SUM(sp.amount) as monto_total
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
AND sp.year = 2025
GROUP BY sp.status;

-- 6. Verificar CESOP 6036 específicamente
SELECT 
    'CESOP 6036 - VERIFICACIÓN:' as cesop_check,
    sp.month,
    sp.year,
    sp.amount,
    sp.status,
    sp.due_date
FROM service_payments sp
JOIN services s ON sp.service_id = s.id
WHERE s.name = 'CESOP 6036'
AND sp.hotel_name ILIKE '%argentina%'
AND sp.year = 2025
ORDER BY sp.month;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM service_payments sp WHERE sp.hotel_name ILIKE '%argentina%' AND sp.year = 2025) >= 120
        THEN '✅ RESTAURACIÓN EXITOSA - Argentina tiene todos sus servicios y pagos'
        ELSE '⚠️ RESTAURACIÓN INCOMPLETA - Faltan algunos pagos'
    END as resultado_final;
