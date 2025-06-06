-- Verificar y corregir la estructura de la tabla employee_assignments
DO $$
BEGIN
    -- Verificar si la columna daily_rate_used existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_assignments' 
        AND column_name = 'daily_rate_used'
    ) THEN
        -- Si no existe, agregarla
        ALTER TABLE employee_assignments 
        ADD COLUMN daily_rate_used DECIMAL(10,2) NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Columna daily_rate_used agregada a employee_assignments';
    ELSE
        -- Si existe pero es NOT NULL sin default, actualizarla
        ALTER TABLE employee_assignments 
        ALTER COLUMN daily_rate_used SET DEFAULT 0;
        
        -- Actualizar registros existentes que tengan NULL
        UPDATE employee_assignments 
        SET daily_rate_used = (
            SELECT daily_rate 
            FROM employees 
            WHERE employees.id = employee_assignments.employee_id
        )
        WHERE daily_rate_used IS NULL;
        
        RAISE NOTICE 'Columna daily_rate_used actualizada en employee_assignments';
    END IF;
END $$;

-- Verificar la estructura actual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_assignments'
ORDER BY ordinal_position;

-- Mostrar algunos registros de ejemplo
SELECT 
    ea.*,
    e.name as employee_name,
    e.daily_rate as current_employee_rate
FROM employee_assignments ea
LEFT JOIN employees e ON ea.employee_id = e.id
ORDER BY ea.created_at DESC
LIMIT 5;
