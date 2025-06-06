-- Script completo para configurar empleados y asignaciones
-- Este script crea todo desde cero de forma segura

BEGIN;

-- 1. Crear empleados si no existen
INSERT INTO employees (name, role, daily_rate, created_at) 
VALUES 
  ('Tucu', 'Mantenimiento', 50000, NOW()),
  ('Diego', 'Mantenimiento', 50000, NOW()),
  ('David', 'Mantenimiento', 50000, NOW()),
  ('Freire', 'Mantenimiento', 50000, NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Obtener IDs de empleados
DO $$
DECLARE
    tucu_id INTEGER;
    diego_id INTEGER;
    david_id INTEGER;
    freire_id INTEGER;
    assignment_count INTEGER;
BEGIN
    -- Obtener IDs
    SELECT id INTO tucu_id FROM employees WHERE name = 'Tucu';
    SELECT id INTO diego_id FROM employees WHERE name = 'Diego';
    SELECT id INTO david_id FROM employees WHERE name = 'David';
    SELECT id INTO freire_id FROM employees WHERE name = 'Freire';
    
    -- Verificar que todos existan
    IF tucu_id IS NULL OR diego_id IS NULL OR david_id IS NULL OR freire_id IS NULL THEN
        RAISE EXCEPTION 'Error: No se pudieron crear todos los empleados';
    END IF;
    
    -- Verificar si ya hay asignaciones
    SELECT COUNT(*) INTO assignment_count FROM employee_assignments 
    WHERE assignment_date >= '2025-04-01' AND assignment_date <= '2025-05-09';
    
    IF assignment_count > 0 THEN
        RAISE NOTICE 'Ya existen % asignaciones en el período. Limpiando primero...', assignment_count;
        DELETE FROM employee_assignments 
        WHERE assignment_date >= '2025-04-01' AND assignment_date <= '2025-05-09';
    END IF;
    
    RAISE NOTICE 'Empleados encontrados - Tucu: %, Diego: %, David: %, Freire: %', tucu_id, diego_id, david_id, freire_id;
    
    -- 3. Insertar todas las asignaciones de abril-mayo 2025
    
    -- 01/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (tucu_id, 'San Miguel', '2025-04-01', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Colores', '2025-04-01', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'San Miguel', '2025-04-01', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Colores', '2025-04-01', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema');
    
    -- 02/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Mallak', '2025-04-02', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Argentina', '2025-04-02', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Argentina', '2025-04-02', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Mallak', '2025-04-02', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 03/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Argentina', '2025-04-03', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Mallak', '2025-04-03', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Argentina', '2025-04-03', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Mallak', '2025-04-03', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 04/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Tupe', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Argentina', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Tupe', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Tupe', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Argentina', '2025-04-04', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema');
    
    -- 05/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Argentina', '2025-04-05', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-05', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Argentina', '2025-04-05', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 07/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Argentina', '2025-04-07', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-07', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Argentina', '2025-04-07', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Argentina', '2025-04-07', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 08/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Argentina', '2025-04-08', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-08', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Argentina', '2025-04-08', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Argentina', '2025-04-08', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 09/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Mallak', '2025-04-09', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Argentina', '2025-04-09', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Mallak', '2025-04-09', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-09', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Argentina', '2025-04-09', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Argentina', '2025-04-09', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 10/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (tucu_id, 'Monaco', '2025-04-10', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Monaco', '2025-04-10', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (diego_id, 'Monaco', '2025-04-10', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Argentina', '2025-04-10', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (freire_id, 'Argentina', '2025-04-10', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- Continuar con más fechas...
    -- 11/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Monaco', '2025-04-11', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Monaco', '2025-04-11', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Monaco', '2025-04-11', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Argentina', '2025-04-11', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 12/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Monaco', '2025-04-12', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (tucu_id, 'Monaco', '2025-04-12', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (david_id, 'Monaco', '2025-04-12', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- 14/04/2025
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (david_id, 'Monaco', '2025-04-14', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (diego_id, 'Argentina', '2025-04-14', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Colores', '2025-04-14', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-14', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Colores', '2025-04-14', 25000, 'Trabajó en 2 hoteles - tarifa dividida', 'sistema'),
    (freire_id, 'Argentina', '2025-04-14', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- Agregar más asignaciones hasta mayo...
    -- 21/04/2025 - Día con 3 hoteles
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (diego_id, 'Argentina', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Colores', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (diego_id, 'Stromboli', '2025-04-21', 16666, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Argentina', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Colores', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (tucu_id, 'Stromboli', '2025-04-21', 16666, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Argentina', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Colores', '2025-04-21', 16667, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (david_id, 'Stromboli', '2025-04-21', 16666, 'Trabajó en 3 hoteles - tarifa dividida', 'sistema'),
    (freire_id, 'San Miguel', '2025-04-21', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- Algunas asignaciones de mayo
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by) VALUES
    (tucu_id, 'Argentina', '2025-05-01', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-01', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-05', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-06', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-07', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-08', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema'),
    (freire_id, 'Barlovento', '2025-05-09', 50000, 'Trabajó en 1 hotel - tarifa completa', 'sistema');
    
    -- Contar asignaciones insertadas
    SELECT COUNT(*) INTO assignment_count FROM employee_assignments 
    WHERE assignment_date >= '2025-04-01' AND assignment_date <= '2025-05-09';
    
    RAISE NOTICE 'Setup completado exitosamente!';
    RAISE NOTICE 'Empleados creados: 4 (Tucu, Diego, David, Freire)';
    RAISE NOTICE 'Asignaciones insertadas: %', assignment_count;
    RAISE NOTICE 'Período: 01/04/2025 - 09/05/2025';
    
END $$;

COMMIT;

-- Verificación final
SELECT 
    'Empleados' as tipo,
    COUNT(*) as cantidad
FROM employees
WHERE name IN ('Tucu', 'Diego', 'David', 'Freire')

UNION ALL

SELECT 
    'Asignaciones' as tipo,
    COUNT(*) as cantidad
FROM employee_assignments
WHERE assignment_date >= '2025-04-01' AND assignment_date <= '2025-05-09';
