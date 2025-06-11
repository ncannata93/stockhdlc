-- Crear tabla de roles de usuario con permisos personalizados
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    custom_permissions JSONB, -- Nueva columna para permisos personalizados
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Insertar usuarios iniciales con sus roles
INSERT INTO user_roles (username, role, updated_by) VALUES
    ('admin', 'SUPER_ADMIN', 'system'),
    ('ncannata', 'SUPER_ADMIN', 'system'),
    ('dpili', 'MANAGER', 'system'),
    ('jprey', 'EMPLOYEE', 'system')
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "Allow read access to all authenticated users" ON user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir escritura solo a administradores
CREATE POLICY IF NOT EXISTS "Allow write access to admins" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.username = auth.jwt() ->> 'username' 
            AND ur.role = 'SUPER_ADMIN'
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE user_roles IS 'Tabla para gestionar roles y permisos de usuarios';
COMMENT ON COLUMN user_roles.username IS 'Nombre de usuario único';
COMMENT ON COLUMN user_roles.role IS 'Rol del usuario (SUPER_ADMIN, MANAGER, EMPLOYEE, CUSTOM)';
COMMENT ON COLUMN user_roles.custom_permissions IS 'Permisos personalizados en formato JSON para usuarios con rol CUSTOM';
COMMENT ON COLUMN user_roles.updated_by IS 'Usuario que realizó la última modificación';
