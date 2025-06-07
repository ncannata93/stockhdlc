-- Script para insertar las asignaciones de empleados de abril y mayo 2025
-- Este script agrupa automáticamente por empleado y fecha para calcular tarifas divididas

-- Primero, verificamos que los empleados existan
DO $$
DECLARE
    tucu_id INTEGER;
    diego_id INTEGER;
    david_id INTEGER;
    freire_id INTEGER;
BEGIN
    -- Obtener IDs de empleados
    SELECT id INTO tucu_id FROM employees WHERE LOWER(name) LIKE '%tucu%' LIMIT 1;
    SELECT id INTO diego_id FROM employees WHERE LOWER(name) LIKE '%diego%' LIMIT 1;
    SELECT id INTO david_id FROM employees WHERE LOWER(name) LIKE '%david%' LIMIT 1;
    SELECT id INTO freire_id FROM employees WHERE LOWER(name) LIKE '%freire%' LIMIT 1;
    
    -- Verificar que todos los empleados existan
    IF tucu_id IS NULL THEN
        RAISE EXCEPTION 'Empleado Tucu no encontrado. Por favor créalo primero.';
    END IF;
    
    IF diego_id IS NULL THEN
        RAISE EXCEPTION 'Empleado Diego no encontrado. Por favor créalo primero.';
    END IF;
    
    IF david_id IS NULL THEN
        RAISE EXCEPTION 'Empleado David no encontrado. Por favor créalo primero.';
    END IF;
    
    IF freire_id IS NULL THEN
        RAISE EXCEPTION 'Empleado Freire no encontrado. Por favor créalo primero.';
    END IF;
    
    RAISE NOTICE 'Todos los empleados encontrados:';
    RAISE NOTICE 'Tucu ID: %', tucu_id;
    RAISE NOTICE 'Diego ID: %', diego_id;
    RAISE NOTICE 'David ID: %', david_id;
    RAISE NOTICE 'Freire ID: %', freire_id;
    
    -- Insertar asignaciones agrupadas por fecha y empleado
    -- 01/04/2025 - Tucu: San Miguel, Colores (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        tucu_id,
        hotel,
        '2025-04-01',
        (SELECT daily_rate FROM employees WHERE id = tucu_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('San Miguel'), ('Colores')) AS hotels(hotel);
    
    -- 01/04/2025 - Diego: San Miguel, Colores (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-01',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('San Miguel'), ('Colores')) AS hotels(hotel);
    
    -- 02/04/2025 - Diego: Mallak, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-02',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Mallak'), ('Argentina')) AS hotels(hotel);
    
    -- 02/04/2025 - David: Argentina (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (david_id, 'Argentina', '2025-04-02', (SELECT daily_rate FROM employees WHERE id = david_id), 'Importación masiva', 'sistema');
    
    -- 02/04/2025 - Tucu: Mallak (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (tucu_id, 'Mallak', '2025-04-02', (SELECT daily_rate FROM employees WHERE id = tucu_id), 'Importación masiva', 'sistema');
    
    -- 03/04/2025 - Diego: Argentina, Mallak (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-03',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('Mallak')) AS hotels(hotel);
    
    -- 03/04/2025 - David: Argentina (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (david_id, 'Argentina', '2025-04-03', (SELECT daily_rate FROM employees WHERE id = david_id), 'Importación masiva', 'sistema');
    
    -- 03/04/2025 - Tucu: Mallak (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (tucu_id, 'Mallak', '2025-04-03', (SELECT daily_rate FROM employees WHERE id = tucu_id), 'Importación masiva', 'sistema');
    
    -- 04/04/2025 - Diego: Tupe, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-04',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Tupe'), ('Argentina')) AS hotels(hotel);
    
    -- 04/04/2025 - Tucu: Tupe, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        tucu_id,
        hotel,
        '2025-04-04',
        (SELECT daily_rate FROM employees WHERE id = tucu_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Tupe'), ('Argentina')) AS hotels(hotel);
    
    -- 04/04/2025 - David: Tupe, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        david_id,
        hotel,
        '2025-04-04',
        (SELECT daily_rate FROM employees WHERE id = david_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Tupe'), ('Argentina')) AS hotels(hotel);
    
    -- 05/04/2025 - Diego, Tucu, David: Argentina (tarifa completa para cada uno)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Argentina',
        '2025-04-05',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id);
    
    -- 07/04/2025 - Diego, Tucu, David, Freire: Argentina (tarifa completa para cada uno)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Argentina',
        '2025-04-07',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id), (freire_id)) AS emps(emp_id);
    
    -- 08/04/2025 - Diego, Tucu, David, Freire: Argentina (tarifa completa para cada uno)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Argentina',
        '2025-04-08',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id), (freire_id)) AS emps(emp_id);
    
    -- 09/04/2025 - Diego: Mallak, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-09',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Mallak'), ('Argentina')) AS hotels(hotel);
    
    -- 09/04/2025 - Tucu: Mallak, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        tucu_id,
        hotel,
        '2025-04-09',
        (SELECT daily_rate FROM employees WHERE id = tucu_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Mallak'), ('Argentina')) AS hotels(hotel);
    
    -- 09/04/2025 - David, Freire: Argentina (tarifa completa para cada uno)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Argentina',
        '2025-04-09',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (david_id), (freire_id)) AS emps(emp_id);
    
    -- 10/04/2025 - Tucu, David, Diego: Monaco (tarifa completa para cada uno)
    -- Diego: Monaco, Argentina (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Monaco',
        '2025-04-10',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (tucu_id), (david_id)) AS emps(emp_id);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-10',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Monaco'), ('Argentina')) AS hotels(hotel);
    
    -- 10/04/2025 - Freire: Argentina (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Argentina', '2025-04-10', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    RAISE NOTICE 'Primeras asignaciones insertadas correctamente hasta el 10/04/2025';
    
END $$;
