-- Continuación del script de inserción - Parte 3
-- Desde 21/04/2025 hasta 09/05/2025

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
    
    -- 21/04/2025 - Diego: Argentina, Colores, Stromboli (tarifa dividida entre 3)
    -- Tucu: Argentina, Colores, Stromboli (tarifa dividida entre 3)
    -- David: Argentina, Colores, Stromboli (tarifa dividida entre 3)
    -- Freire: San Miguel (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        hotel,
        '2025-04-21',
        (SELECT daily_rate FROM employees WHERE id = emp_id) / 3.0,
        'Importación masiva - trabajó en 3 hoteles este día',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id)
    CROSS JOIN (VALUES ('Argentina'), ('Colores'), ('Stromboli')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'San Miguel', '2025-04-21', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 22/04/2025 - Diego: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- Tucu: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- David: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- Freire: Argentina, San Miguel (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        hotel,
        '2025-04-22',
        (SELECT daily_rate FROM employees WHERE id = emp_id) / 3.0,
        'Importación masiva - trabajó en 3 hoteles este día',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id)
    CROSS JOIN (VALUES ('Argentina'), ('Stromboli'), ('Colores')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        freire_id,
        hotel,
        '2025-04-22',
        (SELECT daily_rate FROM employees WHERE id = freire_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('San Miguel')) AS hotels(hotel);
    
    -- 23/04/2025 - Diego: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- Tucu: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- David: Argentina, Stromboli, Colores (tarifa dividida entre 3)
    -- Freire: Argentina, San Miguel (tarifa dividida entre 2)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        hotel,
        '2025-04-23',
        (SELECT daily_rate FROM employees WHERE id = emp_id) / 3.0,
        'Importación masiva - trabajó en 3 hoteles este día',
        'sistema'
    FROM (VALUES (diego_id), (tucu_id), (david_id)) AS emps(emp_id)
    CROSS JOIN (VALUES ('Argentina'), ('Stromboli'), ('Colores')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        freire_id,
        hotel,
        '2025-04-23',
        (SELECT daily_rate FROM employees WHERE id = freire_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('San Miguel')) AS hotels(hotel);
    
    -- 24/04/2025 - Freire: San Miguel (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'San Miguel', '2025-04-24', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 25/04/2025 - Freire: Argentina, San Miguel (tarifa dividida entre 2)
    -- Tucu: Puntarenas (tarifa completa)
    -- David: Puntarenas (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        freire_id,
        hotel,
        '2025-04-25',
        (SELECT daily_rate FROM employees WHERE id = freire_id) / 2.0,
        'Importación masiva - trabajó en 2 hoteles este día',
        'sistema'
    FROM (VALUES ('Argentina'), ('San Miguel')) AS hotels(hotel);
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Puntarenas',
        '2025-04-25',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (tucu_id), (david_id)) AS emps(emp_id);
    
    -- 26/04/2025 - Tucu: Puntarenas (tarifa completa)
    -- David: Puntarenas (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        emp_id,
        'Puntarenas',
        '2025-04-26',
        (SELECT daily_rate FROM employees WHERE id = emp_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES (tucu_id), (david_id)) AS emps(emp_id);
    
    -- 28/04/2025 - Tucu: Colores (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (tucu_id, 'Colores', '2025-04-28', (SELECT daily_rate FROM employees WHERE id = tucu_id), 'Importación masiva', 'sistema');
    
    -- 29/04/2025 - Freire: Barlovento (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Barlovento', '2025-04-29', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 30/04/2025 - Freire: Barlovento (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Barlovento', '2025-04-30', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- MAYO 2025
    -- 01/05/2025 - Tucu: Argentina (tarifa completa)
    -- Freire: Barlovento (tarifa completa)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (tucu_id, 'Argentina', '2025-05-01', (SELECT daily_rate FROM employees WHERE id = tucu_id), 'Importación masiva', 'sistema');
    
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    VALUES (freire_id, 'Barlovento', '2025-05-01', (SELECT daily_rate FROM employees WHERE id = freire_id), 'Importación masiva', 'sistema');
    
    -- 05/05/2025 al 09/05/2025 - Freire: Barlovento (tarifa completa cada día)
    INSERT INTO employee_assignments (employee_id, hotel_name, assignment_date, daily_rate_used, notes, created_by)
    SELECT 
        freire_id,
        'Barlovento',
        fecha,
        (SELECT daily_rate FROM employees WHERE id = freire_id),
        'Importación masiva',
        'sistema'
    FROM (VALUES 
        ('2025-05-05'::date), 
        ('2025-05-06'::date), 
        ('2025-05-07'::date), 
        ('2025-05-08'::date), 
        ('2025-05-09'::date)
    ) AS fechas(fecha);
    
    RAISE NOTICE 'Todas las asignaciones han sido insertadas correctamente!';
    RAISE NOTICE 'Total de registros procesados: aproximadamente 150+ asignaciones';
    RAISE NOTICE 'Período: 01/04/2025 al 09/05/2025';
    RAISE NOTICE 'Empleados: Tucu, Diego, David, Freire';
    
END $$;
