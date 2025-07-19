-- Verificar que la restauración de Argentina fue exitosa
-- Este script confirma que todo está funcionando correctamente

-- 1. Verificar hotel Argentina
SELECT 
    'HOTEL ARGENTINA' as seccion,
    id,
    name,
    created_at::date as fecha_creacion
FROM hotels 
WHERE name ILIKE '%argentina%';

-- 2. Verificar servicios restaurados
SELECT 
    'SERVICIOS ACTIVOS' as seccion,
    s.name as servicio,
    s.average_amount as promedio_mensual,
    s.active as activo,
    s.created_at::date as fecha_creacion
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%' AND s.active = true
ORDER BY s.name;

-- 3. Verificar pagos por mes/año
SELECT 
    'PAGOS POR MES' as seccion,
    year as año,
    month as mes,
    COUNT(*) as cantidad_pagos,
    SUM(amount) as total_mes,
    COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'abonado' THEN 1 END) as abonados
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
GROUP BY year, month
ORDER BY year, month;

-- 4. Verificar pagos por servicio
SELECT 
    'PAGOS POR SERVICIO' as seccion,
    service_name as servicio,
    COUNT(*) as total_pagos,
    COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'abonado' THEN 1 END) as abonados,
    AVG(amount) as promedio_monto,
    MIN(year || '-' || LPAD(month::text, 2, '0')) as primer_pago,
    MAX(year || '-' || LPAD(month::text, 2, '0')) as ultimo_pago
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
GROUP BY service_name
ORDER BY service_name;

-- 5. Verificar próximos vencimientos
SELECT 
    'PRÓXIMOS VENCIMIENTOS' as seccion,
    service_name as servicio,
    month as mes,
    year as año,
    amount as monto,
    due_date as fecha_vencimiento,
    status
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
  AND sp.status = 'pendiente'
  AND sp.due_date >= CURRENT_DATE
ORDER BY sp.due_date
LIMIT 10;

-- 6. Resumen final
SELECT 
    'RESUMEN FINAL' as seccion,
    COUNT(DISTINCT s.id) as servicios_activos,
    COUNT(sp.id) as total_pagos,
    COUNT(CASE WHEN sp.status = 'pendiente' THEN 1 END) as pagos_pendientes,
    COUNT(CASE WHEN sp.status = 'abonado' THEN 1 END) as pagos_abonados,
    SUM(CASE WHEN sp.status = 'pendiente' THEN sp.amount ELSE 0 END) as monto_pendiente,
    SUM(CASE WHEN sp.status = 'abonado' THEN sp.amount ELSE 0 END) as monto_abonado
FROM services s
JOIN hotels h ON s.hotel_id = h.id
LEFT JOIN service_payments sp ON s.id = sp.service_id
WHERE h.name ILIKE '%argentina%' AND s.active = true;
