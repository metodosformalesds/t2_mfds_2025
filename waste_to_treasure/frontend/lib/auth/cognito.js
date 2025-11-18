import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'
import { 
  signOut as amplifySignOut,
  fetchAuthSession,
  fetchUserAttributes 
} from '@aws-amplify/auth'

// Configuracion del User Pool de Cognito
const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
}

let userPool

// Inicializar User Pool solo en el cliente
if (typeof window !== 'undefined') {
  if (!poolData.UserPoolId || !poolData.ClientId) {
    console.error('Variables de Cognito no configuradas correctamente:', {
      UserPoolId: poolData.UserPoolId ? 'OK' : 'MISSING',
      ClientId: poolData.ClientId ? 'OK' : 'MISSING',
    })
  } else {
    userPool = new CognitoUserPool(poolData)
  }
}

/**
 * Registrar un nuevo usuario en Cognito
 */
export const signUp = async ({ email, password, name }) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
    ]

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.error('Cognito signup error:', err)
        reject(err)
        return
      }

      resolve({
        user: result.user,
        userConfirmed: result.userConfirmed,
        userSub: result.userSub,
      })
    })
  })
}

/**
 * Confirmar el codigo de verificacion enviado por email
 */
export const confirmSignUp = async (email, code) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const userData = {
      Username: email,
      Pool: userPool,
    }

    const cognitoUser = new CognitoUser(userData)

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('Confirm signup error:', err)
        reject(err)
        return
      }

      resolve(result)
    })
  })
}

/**
 * Reenviar codigo de verificacion
 */
export const resendConfirmationCode = async email => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const userData = {
      Username: email,
      Pool: userPool,
    }

    const cognitoUser = new CognitoUser(userData)

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        console.error('Resend code error:', err)
        reject(err)
        return
      }

      resolve(result)
    })
  })
}

/**
 * Solicitar recuperación de contraseña
 * Cognito enviará un código de verificación al email del usuario
 */
export const forgotPassword = async (email) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const userData = {
      Username: email,
      Pool: userPool,
    }

    const cognitoUser = new CognitoUser(userData)

    cognitoUser.forgotPassword({
      onSuccess: (result) => {
        console.log('Forgot password success:', result)
        resolve(result)
      },
      onFailure: (err) => {
        console.error('Forgot password error:', err)
        reject(err)
      },
      // inputVerificationCode es llamado cuando Cognito está listo para recibir el código
      inputVerificationCode: (data) => {
        console.log('Código de verificación enviado:', data)
        resolve({
          CodeDeliveryDetails: data,
          message: 'Código de verificación enviado exitosamente'
        })
      }
    })
  })
}

/**
 * Confirmar nueva contraseña con el código de verificación
 * @param {string} email - Email del usuario
 * @param {string} verificationCode - Código recibido por email
 * @param {string} newPassword - Nueva contraseña
 */
export const confirmPassword = async (email, verificationCode, newPassword) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const userData = {
      Username: email,
      Pool: userPool,
    }

    const cognitoUser = new CognitoUser(userData)

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => {
        console.log('Password successfully changed')
        resolve({ message: 'Contraseña cambiada exitosamente' })
      },
      onFailure: (err) => {
        console.error('Confirm password error:', err)
        reject(err)
      }
    })
  })
}

/**
 * Iniciar sesion con email y contraseña
 */
export const signIn = async (email, password) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no esta configurado'))
      return
    }

    const authenticationData = {
      Username: email,
      Password: password,
    }

    const authenticationDetails = new AuthenticationDetails(authenticationData)

    const userData = {
      Username: email,
      Pool: userPool,
    }

    const cognitoUser = new CognitoUser(userData)

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => {
        const accessToken = result.getAccessToken().getJwtToken()
        const idToken = result.getIdToken().getJwtToken()
        const refreshToken = result.getRefreshToken().getToken()

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', idToken)
        }

        resolve({
          accessToken,
          idToken,
          refreshToken,
          user: cognitoUser,
        })
      },
      onFailure: err => {
        console.error('Sign in error:', err)
        reject(err)
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        reject({
          code: 'NewPasswordRequired',
          userAttributes,
          requiredAttributes,
        })
      },
    })
  })
}

/**
 * Cerrar sesion del usuario actual
 */
export const signOut = async () => {
  try {
    await amplifySignOut()
  } catch (error) {
    console.log('No OAuth session to sign out')
  }

  if (userPool) {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('id-token')
    localStorage.removeItem('refresh-token')
  }
}

/**
 * Decodificar JWT (solo la parte del payload)
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decodificando JWT:', error)
    return null
  }
}

/**
 * Obtener el usuario actual autenticado
 */
export const getCurrentUser = async () => {
  // Primero intentar obtener sesion de Amplify (OAuth)
  try {
    const session = await fetchAuthSession()
    if (session.tokens?.idToken) {
      console.log('✅ [getCurrentUser] Session de OAuth/Amplify encontrada')

      const attributes = await fetchUserAttributes()

      const idToken = session.tokens.idToken.toString()
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', idToken)
      }

      return {
        username: attributes.email || attributes.sub,
        attributes: {
          email: attributes.email,
          name: attributes.name,
          sub: attributes.sub,
          email_verified: attributes.email_verified,
        },
        session: {
          getIdToken: () => ({
            getJwtToken: () => idToken
          }),
          isValid: () => true
        },
      }
    }
  } catch (error) {
    console.log('ℹ️ [getCurrentUser] No OAuth/Amplify session found, trying other methods...')
  }

  // Si no hay sesión de Amplify, verificar si hay token en localStorage (OAuth manual)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token')
    if (token) {
      console.log('🔑 [getCurrentUser] Token encontrado en localStorage, decodificando...')
      const decoded = decodeJWT(token)

      if (decoded) {
        console.log('✅ [getCurrentUser] Token decodificado exitosamente')
        return {
          username: decoded.email || decoded.sub,
          attributes: {
            email: decoded.email,
            name: decoded.name,
            given_name: decoded.given_name,
            family_name: decoded.family_name,
            sub: decoded.sub,
            email_verified: decoded.email_verified,
          },
          session: {
            getIdToken: () => ({
              getJwtToken: () => token
            }),
            isValid: () => {
              // Verificar si el token ha expirado
              const now = Math.floor(Date.now() / 1000)
              return decoded.exp && decoded.exp > now
            }
          },
        }
      }
    }
  }

  // Si no hay sesion OAuth, intentar con User Pool
  return new Promise((resolve, reject) => {
    if (!userPool) {
      resolve(null)
      return
    }

    const cognitoUser = userPool.getCurrentUser()

    if (!cognitoUser) {
      resolve(null)
      return
    }

    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error('Get session error:', err)
        reject(err)
        return
      }

      if (!session.isValid()) {
        resolve(null)
        return
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          console.error('Get user attributes error:', err)
          reject(err)
          return
        }

        const userData = {}
        attributes.forEach(attribute => {
          userData[attribute.Name] = attribute.Value
        })

        resolve({
          username: cognitoUser.getUsername(),
          attributes: userData,
          session,
        })
      })
    })
  })
}

/**
 * Obtener el token de sesion actual
 */
export const getAuthToken = async () => {
  try {
    const user = await getCurrentUser()
    if (user && user.session) {
      return user.session.getIdToken().getJwtToken()
    }
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Verificar si el usuario esta autenticado
 * Primero verifica localStorage (para OAuth), luego Amplify, luego User Pool
 */
export const isAuthenticated = async () => {
  try {
    // Primero verificar si hay token en localStorage (OAuth)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        console.log('✅ [isAuthenticated] Token encontrado en localStorage')
        return true
      }
    }

    // Si no hay token en localStorage, intentar con Amplify/User Pool
    const user = await getCurrentUser()
    return !!user
  } catch (error) {
    console.error('❌ [isAuthenticated] Error:', error)
    return false
  }
}

/**
 * Construir URL de OAuth para Google manualmente
 * Esto redirige al Hosted UI de Cognito que luego redirige a Google
 */
export const signInWithProvider = async (provider) => {
  if (typeof window === 'undefined') return

  try {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const currentUrl = window.location.origin
    
    if (!domain || !clientId) {
      throw new Error('Variables de Cognito no configuradas: domain=' + domain + ', clientId=' + clientId)
    }
    
    // Determinar la URL de redirect basada en el entorno
    const redirectUri = currentUrl.includes('amplifyapp.com')
      ? 'https://main.d20d0dqywsvuyq.amplifyapp.com/callback'
      : 'http://localhost:3000/callback'

    console.log('Configuracion OAuth:', { 
      domain, 
      clientId, 
      redirectUri,
      provider 
    })

    // Construir URL del Hosted UI de Cognito
    const oauthUrl = `https://${domain}/oauth2/authorize?` +
      `identity_provider=${provider}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=email+openid+profile`

    console.log('URL completa de OAuth:', oauthUrl)
    console.log('Redirigiendo en 1 segundo...')

    // Pequeña pausa para que se vean los logs
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Redirigir al Hosted UI de Cognito
    window.location.href = oauthUrl

  } catch (error) {
    console.error('Error durante federated sign in:', error)
    throw error
  }
}

export default {
  signUp,
  confirmSignUp,
  resendConfirmationCode,
  signIn,
  signOut,
  getCurrentUser,
  getAuthToken,
  isAuthenticated,
  signInWithProvider,
  forgotPassword,
  confirmPassword,
}