-- Función mejorada para permitir que un administrador actualice la contraseña de un usuario
-- Esta versión corrige problemas comunes y añade más información de depuración

CREATE OR REPLACE FUNCTION admin_update_user_password(user_email TEXT, new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los privilegios del creador
AS $$
DECLARE
  user_id UUID;
  result JSONB;
BEGIN
  -- Primero verificar si el usuario existe
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- Si no se encuentra el usuario, devolver error
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado',
      'email', user_email
    );
  END IF;
  
  -- Actualizar la contraseña del usuario
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now(),
    last_sign_in_at = now()
  WHERE id = user_id;
  
  -- Verificar si la actualización fue exitosa
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Contraseña actualizada correctamente',
      'user_id', user_id,
      'email', user_email
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error al actualizar la contraseña',
      'user_id', user_id,
      'email', user_email
    );
  END IF;
END;
$$;

-- Otorgar permisos para ejecutar esta función
GRANT EXECUTE ON FUNCTION admin_update_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_password TO anon;
