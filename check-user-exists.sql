-- Función para verificar si un usuario existe en la base de datos
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
