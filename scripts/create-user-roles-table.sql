-- Crear tabla de roles de usuario si no existe
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  CONSTRAINT valid_role CHECK (role IN ('SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'))
);

-- Crear índice para búsquedas rápidas por username
CREATE INDEX IF NOT EXISTS idx_user_roles_username ON public.user_roles(username);

-- Trigger para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS update_user_roles_timestamp ON public.user_roles;
CREATE TRIGGER update_user_roles_timestamp
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Insertar datos iniciales si no existen
INSERT INTO public.user_roles (username, role, updated_by)
VALUES 
  ('admin', 'SUPER_ADMIN', 'system'),
  ('ncannata', 'SUPER_ADMIN', 'system'),
  ('dpili', 'MANAGER', 'system'),
  ('jprey', 'EMPLOYEE', 'system')
ON CONFLICT (username) 
DO NOTHING;
