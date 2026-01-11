-- Agregar columna para guardar la tarifa del día trabajado
ALTER TABLE employee_assignments 
ADD COLUMN daily_rate_used DECIMAL(10,2);

-- Actualizar registros existentes con la tarifa actual del empleado
UPDATE employee_assignments 
SET daily_rate_used = (
  SELECT daily_rate 
  FROM employees 
  WHERE employees.id = employee_assignments.employee_id
)
WHERE daily_rate_used IS NULL;

-- Hacer la columna obligatoria después de actualizar los datos existentes
ALTER TABLE employee_assignments 
ALTER COLUMN daily_rate_used SET NOT NULL;

-- Agregar comentario para documentar el propósito
COMMENT ON COLUMN employee_assignments.daily_rate_used IS 'Tarifa diaria que se aplicó en el momento de crear esta asignación';
