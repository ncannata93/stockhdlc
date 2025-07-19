-- Investigar servicios faltantes de Argentina
SELECT 'INVESTIGANDO SERVICIOS FALTANTES DE ARGENTINA' as titulo;

-- 1. Verificar si existe el hotel Argentina
SELECT 
    'HOTEL ARGENTINA:' as seccion,
    CASE WHEN EXISTS (SELECT 1 FROM hotels WHERE name ILIKE '%argentina%') 
         THEN '✅ EXISTE' 
         ELSE '❌ NO EXISTE' 
    END as estado;

-- 2. Mostrar información del hotel Argentina si existe
SELECT 
    'Información del Hotel Argentina:' as info,
    h.id,
    h.name,
    h.address,
    h.phone,
    h.created_at
FROM hotels h
WHERE h.name ILIKE '%argentina%';

-- 3. Contar servicios actuales de Argentina
SELECT 
    'SERVICIOS DE ARGENTINA:' as seccion,
    COUNT(*) as total_servicios,
    COUNT(CASE WHEN active = true THEN 1 END) as servicios_activos,
    COUNT(CASE WHEN active = false THEN 1 END) as servicios_inactivos
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%';

-- 4. Listar servicios existentes de Argentina
SELECT 
    'Servicios existentes de Argentina:' as detalle,
    s.name as servicio,
    s.category,
    s.provider,
    s.average_amount,
    s.active,
    s.created_at
FROM services s
JOIN hotels h ON s.hotel_id = h.id
WHERE h.name ILIKE '%argentina%'
ORDER BY s.name;

-- 5. Verificar pagos de Argentina
SELECT 
    'PAGOS DE ARGENTINA:' as seccion,
    COUNT(*) as total_pagos,
    COUNT(CASE WHEN status = 'abonado' THEN 1 END) as pagos_abonados,
    COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pagos_pendientes,
    COUNT(CASE WHEN status = 'vencido' THEN 1 END) as pagos_vencidos
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%';

-- 6. Mostrar distribución de pagos por año
SELECT 
    'Pagos por año:' as distribucion,
    sp.year,
    COUNT(*) as cantidad_pagos,
    SUM(sp.amount) as monto_total
FROM service_payments sp
WHERE sp.hotel_name ILIKE '%argentina%'
GROUP BY sp.year
ORDER BY sp.year;

-- 7. Verificar si faltan servicios típicos
SELECT 'SERVICIOS TÍPICOS FALTANTES:' as analisis;

WITH servicios_tipicos AS (
    SELECT unnest(ARRAY[
        'Electricidad', 'Gas', 'Agua', 'Internet', 'Teléfono',
        'Cable TV', 'Seguridad', 'Limpieza', 'Mantenimiento', 'CESOP 6036'
    ]) as servicio_esperado
),
servicios_existentes AS (
    SELECT s.name
    FROM services s
    JOIN hotels h ON s.hotel_id = h.id
    WHERE h.name ILIKE '%argentina%'
    AND s.active = true
)
SELECT 
    st.servicio_esperado,
    CASE WHEN se.name IS NOT NULL THEN '✅ EXISTE' ELSE '❌ FALTA' END as estado
FROM servicios_tipicos st
LEFT JOIN servicios_existentes se ON se.name ILIKE '%' || st.servicio_esperado || '%'
ORDER BY st.servicio_esperado;

SELECT 'INVESTIGACIÓN COMPLETADA' as resultado;
