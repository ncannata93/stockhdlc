-- Función mejorada para confirmar usuarios automáticamente
CREATE OR REPLACE FUNCTION admin_confirm_user(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el usuario existe
  SELECT id, EXISTS(
    SELECT 1 FROM auth.users WHERE email = user_email
  ) INTO user_id, user_exists FROM auth.users WHERE email = user_email;
  
  -- Si el usuario no existe, devolver error
  IF NOT user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado',
      'email', user_email
    );
  END IF;
  
  -- Confirmar el usuario
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now()),
    last_sign_in_at = now()
  WHERE id = user_id;
  
  -- Verificar si la actualización fue exitosa
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Usuario confirmado correctamente',
      'user_id', user_id,
      'email', user_email
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error al confirmar el usuario',
      'user_id', user_id,
      'email', user_email
    );
  END IF;
END;
$$;

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

-- Otorgar permisos para ejecutar estas funciones
GRANT EXECUTE ON FUNCTION admin_confirm_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_user TO anon;
GRANT EXECUTE ON FUNCTION check_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists TO anon;
