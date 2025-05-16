-- Crear tabla para almacenar perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permisos para la tabla
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Usuarios autenticados pueden ver perfiles" 
  ON public.user_profiles FOR SELECT 
  TO authenticated, anon
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar sus propios perfiles" 
  ON public.user_profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Función para confirmar usuarios automáticamente (sin necesidad de verificación por correo)
CREATE OR REPLACE FUNCTION admin_confirm_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

-- Otorgar permisos para ejecutar esta función
GRANT EXECUTE ON FUNCTION admin_confirm_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_user TO anon;

-- Función para verificar si un usuario existe
CREATE OR REPLACE FUNCTION check_user_exists(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = user_email
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Otorgar permisos para ejecutar esta función
GRANT EXECUTE ON FUNCTION check_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists TO anon;
