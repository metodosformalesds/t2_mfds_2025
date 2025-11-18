/**
 * Helper para manejar el flujo OAuth de Cognito
 * Intercambia el codigo de autorizacion por tokens JWT
 */

/**
 * Intercambia el codigo OAuth por tokens
 * @param {string} code - Codigo de autorizacion de OAuth
 * @param {string} redirectUri - URI de redirect usado en la autorizacion
 * @returns {Promise<Object>} Tokens de autenticacion
 */
export async function exchangeCodeForTokens(code, redirectUri) {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
  
  if (!domain || !clientId) {
    throw new Error('Configuracion de Cognito incompleta')
  }

  const tokenEndpoint = `https://${domain}/oauth2/token`
  
  // Preparar el body para la peticion
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code: code,
    redirect_uri: redirectUri,
  })

  try {
    console.log('Intercambiando codigo por tokens...')
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error del servidor:', errorData)
      throw new Error(`Error intercambiando codigo: ${response.status}`)
    }

    const tokens = await response.json()
    
    console.log('Tokens obtenidos exitosamente')
    
    return {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    }
  } catch (error) {
    console.error('Error en exchangeCodeForTokens:', error)
    throw error
  }
}

/**
 * Decodifica un JWT sin verificar la firma (solo para obtener claims)
 * @param {string} token - Token JWT
 * @returns {Object} Claims del token
 */
export function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Token JWT invalido')
    }
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    return decoded
  } catch (error) {
    console.error('Error decodificando JWT:', error)
    throw error
  }
}

/**
 * Obtiene los atributos del usuario desde el ID token
 * @param {string} idToken - ID Token JWT
 * @returns {Object} Atributos del usuario
 */
export function getUserAttributesFromToken(idToken) {
  const claims = decodeJWT(idToken)
  
  return {
    sub: claims.sub,
    email: claims.email,
    email_verified: claims.email_verified,
    name: claims.name || claims.given_name || claims.email,
    given_name: claims.given_name,
    family_name: claims.family_name,
    picture: claims.picture,
  }
}