-- Continuación del script de inserción - Parte 2
-- Desde 11/04/2025 hasta 30/04/2025

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
    
    -- 11/04/2025 - Diego, Tucu, David: Monaco (tarifa completa para cada uno)
    -- Freire: Argentina (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Monaco',
        '2025-04-11',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Argentina', '2025-04-11', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 12/04/2025 - Diego, Tucu, David: Monaco (tarifa completa para cada uno)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Monaco',
        '2025-04-12',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id);
    
    -- 14/04/2025 - David: Monaco (tarifa completa)
    -- Diego: Argentina, Colores (tarifa dividida entre 2)
    -- Tucu: Argentina, Colores (tarifa dividida entre 2)
    -- Freire: Argentina (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (david_id, 'Monaco', '2025-04-14', (SELECT daily_rate FROM employees WHERE id = david_id), 'Importación masiva', 'sistema');
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-14',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('Colores')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        tucu_id,
        hotel,
        '2025-04-14',
        (SELECT daily_rate FROM employees WHERE id = tucu_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('Colores')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Argentina', '2025-04-14', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 15/04/2025 - Diego: Monaco, Argentina (tarifa dividida entre 2)
    -- Tucu: Monaco, Argentina (tarifa dividida entre 2)
    -- David: Monaco, Argentina (tarifa dividida entre 2)
    -- Freire: Colores (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        diego_id,
        hotel,
        '2025-04-15',
        (SELECT daily_rate FROM employees WHERE id = diego_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Monaco'), ('Argentina')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        tucu_id,
        hotel,
        '2025-04-15',
        (SELECT daily_rate FROM employees WHERE id = tucu_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Monaco'), ('Argentina')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        david_id,
        hotel,
        '2025-04-15',
        (SELECT daily_rate FROM employees WHERE id = david_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Monaco'), ('Argentina')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Colores', '2025-04-15', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 16/04/2025 - Diego: Argentina, Colores (tarifa dividida entre 2)
    -- Tucu: Argentina, Colores (tarifa dividida entre 2)
    -- David: Argentina, Colores (tarifa dividida entre 2)
    -- Freire: Colores (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        hotel,
        '2025-04-16',
        (SELECT daily_rate FROM employees WHERE id = emp_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id)
    CROSS JOIN (VALUES ('Argentina'), ('Colores')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Colores', '2025-04-16', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 17/04/2025 - Diego, Tucu, David: Argentina (tarifa completa para cada uno - aparecen duplicados en el listado)
    -- Freire: San Miguel (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Argentina',
        '2025-04-17',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'San Miguel', '2025-04-17', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 18/04/2025 - Freire: San Miguel (tarifa completa)
    -- Tucu: Argentina, Colores (tarifa dividida entre 2)
    -- David: Argentina, Colores (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'San Miguel', '2025-04-18', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        hotel,
        '2025-04-18',
        (SELECT daily_rate FROM employees WHERE id = emp_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES (tucu_id), (david_id)) AS emps(emp_id)
    CROSS JOIN (VALUES ('Argentina'), ('Colores')) AS hotels(hotel);
    
    -- 19/04/2025 - David: Argentina (tarifa completa - aparece duplicado)
    -- Tucu: Colores (tarifa completa - aparece duplicado)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (david_id, 'Argentina', '2025-04-19', (SELECT daily_rate FROM employees WHERE id = david_id), 'Importación masiva', 'sistema');
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (tucu_id, 'Colores', '2025-04-19', (SELECT daily_rate FROM employees WHERE id = tucu_id), 'Importación masiva', 'sistema');
    
    RAISE NOTICE 'Asignaciones insertadas correctamente hasta el 19/04/2025';
    
END $$;
