-- Verificar si la tabla existe y crearla si no
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    custom_permissions TEXT[], -- Array de texto para mejor compatibilidad
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar la columna custom_permissions si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'custom_permissions') THEN
        ALTER TABLE user_roles ADD COLUMN custom_permissions TEXT[];
        RAISE NOTICE 'Columna custom_permissions agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna custom_permissions ya existe';
    END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_roles_username ON user_roles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios iniciales con sus roles (solo si no existen)
INSERT INTO user_roles (username, role, updated_by) VALUES
    ('admin', 'SUPER_ADMIN', 'system'),
    ('ncannata', 'SUPER_ADMIN', 'system'),
    ('dpili', 'MANAGER', 'system'),
    ('jprey', 'EMPLOYEE', 'system')
ON CONFLICT (username) DO NOTHING;

-- Verificar que los datos se insertaron correctamente
SELECT 
    username, 
    role, 
    custom_permissions,
    created_at,
    updated_at
FROM user_roles 
ORDER BY username;

-- Verificar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;
