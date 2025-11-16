import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'
// Auth moved to a separate package in aws-amplify v6+
// Import the modular Auth package directly.
// The auth package exports named functions (e.g. signInWithRedirect) rather than
// a single `Auth` object in aws-amplify v6+. Import the helper we need.
import { signInWithRedirect } from '@aws-amplify/auth'

// Configuración del User Pool de Cognito
const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
}

let userPool

// Inicializar User Pool solo en el cliente
if (typeof window !== 'undefined') {
  // Validar que las variables existan antes de crear el pool
  if (!poolData.UserPoolId || !poolData.ClientId) {
    console.error('❌ Variables de Cognito no configuradas correctamente:', {
      UserPoolId: poolData.UserPoolId ? '✅' : '❌',
      ClientId: poolData.ClientId ? '✅' : '❌',
    })
  } else {
    userPool = new CognitoUserPool(poolData)
  }
}

/**
 * Registrar un nuevo usuario en Cognito
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña
 * @param {string} userData.name - Nombre completo del usuario
 * @returns {Promise<Object>} Resultado del registro
 */
export const signUp = async ({ email, password, name }) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no está configurado'))
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
 * Confirmar el código de verificación enviado por email
 * @param {string} email - Email del usuario
 * @param {string} code - Código de verificación
 * @returns {Promise<string>} Mensaje de confirmación
 */
export const confirmSignUp = async (email, code) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no está configurado'))
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
 * Reenviar código de verificación
 * @param {string} email - Email del usuario
 * @returns {Promise<string>} Mensaje de confirmación
 */
export const resendConfirmationCode = async email => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no está configurado'))
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
 * Iniciar sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Datos de sesión
 */
export const signIn = async (email, password) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito User Pool no está configurado'))
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

        // Store the ID token in localStorage for API authentication
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
        // Usuario necesita cambiar contraseña
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
 * Cerrar sesión del usuario actual
 * @returns {void}
 */
export const signOut = () => {
  if (!userPool) {
    console.error('Cognito User Pool no está configurado')
    return
  }

  const cognitoUser = userPool.getCurrentUser()
  if (cognitoUser) {
    cognitoUser.signOut()
  }

  // Limpiar localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('id-token')
    localStorage.removeItem('refresh-token')
  }
}

/**
 * Obtener el usuario actual autenticado
 * @returns {Promise<Object|null>} Datos del usuario o null
 */
export const getCurrentUser = async () => {
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
 * Obtener el token de sesión actual
 * @returns {Promise<string|null>} Token JWT o null
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
 * Verificar si el usuario está autenticado
 * @returns {Promise<boolean>} True si está autenticado
 */
export const isAuthenticated = async () => {
  try {
    const user = await getCurrentUser()
    return !!user
  } catch (error) {
    return false
  }
}

/**
 * Inicia el flujo de inicio de sesión con un proveedor federado (Google, Facebook, etc.)
 * @param {string} provider - El nombre del proveedor (ej. 'Google')
 * @returns {Promise<void>}
 */
export const signInWithProvider = async provider => {
  try {
    // Use the modular signInWithRedirect helper which triggers the
    // Cognito Hosted UI / provider redirect flow.
    await signInWithRedirect({ provider })
  } catch (error) {
    console.error('Error during federated sign in', error)
    // El error se manejará en la UI, aquí solo lo logueamos.
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
}
