-- Verificar si hay un patrón de eliminación masiva de servicios

-- 1. Ver servicios eliminados recientemente
SELECT 
    'SERVICIOS ELIMINADOS RECIENTEMENTE' as tipo,
    s.name,
    s.hotel_id,
    h.name as hotel,
    s.active,
    s.updated_at,
    EXTRACT(days FROM NOW() - s.updated_at) as dias_desde_actualizacion
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE s.active = false
AND s.updated_at > NOW() - INTERVAL '7 days'
ORDER BY s.updated_at DESC;

-- 2. Ver si hay servicios con muchos pagos pero que están inactivos
SELECT 
    'SERVICIOS INACTIVOS CON MUCHOS PAGOS' as tipo,
    s.name,
    h.name as hotel,
    s.active,
    COUNT(sp.id) as total_pagos,
    s.updated_at
FROM services s
JOIN hotels h ON s.hotel_id = h.id
LEFT JOIN service_payments sp ON s.id = sp.service_id
WHERE s.active = false
GROUP BY s.id, s.name, h.name, s.active, s.updated_at
HAVING COUNT(sp.id) > 10
ORDER BY total_pagos DESC;

-- 3. Verificar integridad de datos
SELECT 
    'VERIFICACION INTEGRIDAD' as tipo,
    COUNT(DISTINCT sp.service_id) as servicios_en_pagos,
    COUNT(DISTINCT s.id) as servicios_en_tabla,
    COUNT(DISTINCT sp.service_id) - COUNT(DISTINCT s.id) as diferencia
FROM service_payments sp
FULL OUTER JOIN services s ON sp.service_id = s.id
WHERE sp.hotel_id = '4' OR s.hotel_id = '4';
