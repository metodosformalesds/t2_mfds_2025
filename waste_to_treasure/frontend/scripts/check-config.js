#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar configuración de API
 * Se ejecuta durante el build para verificar que las variables de entorno estén correctas
 */

console.log('\n' + '='.repeat(70))
console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN DE API')
console.log('='.repeat(70) + '\n')

const API_URL = process.env.NEXT_PUBLIC_API_URL
const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION
const COGNITO_POOL = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
const NODE_ENV = process.env.NODE_ENV

console.log('📊 Variables de Entorno:')
console.log('━'.repeat(70))
console.log(`  NODE_ENV: ${NODE_ENV || '(undefined)'}`)
console.log(`  NEXT_PUBLIC_API_URL: ${API_URL || '(undefined)'}`)
console.log(`  NEXT_PUBLIC_COGNITO_REGION: ${COGNITO_REGION || '(undefined)'}`)
console.log(`  NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${COGNITO_POOL || '(undefined)'}`)
console.log()

// Validaciones
let hasErrors = false
let hasWarnings = false

console.log('✅ Validaciones:')
console.log('━'.repeat(70))

// 1. Verificar que NEXT_PUBLIC_API_URL esté definida
if (!API_URL) {
  console.error('  ❌ NEXT_PUBLIC_API_URL no está definida')
  console.error('     → Esto hará que la app use localhost por defecto')
  console.error('     → En producción, DEBE configurarse en Amplify Console')
  hasErrors = true
} else {
  console.log(`  ✅ NEXT_PUBLIC_API_URL está definida`)
  
  // 2. Verificar que no apunte a localhost en producción
  if (NODE_ENV === 'production' && API_URL.includes('localhost')) {
    console.error('  ❌ API_URL apunta a localhost en producción!')
    console.error('     → Valor actual: ' + API_URL)
    console.error('     → Debe ser: https://4vopem29wa.execute-api.us-east-1.amazonaws.com')
    hasErrors = true
  } else if (API_URL.includes('localhost')) {
    console.log('  ℹ️  API_URL apunta a localhost (OK para desarrollo)')
  }
  
  // 3. Verificar que use API Gateway en producción, no Elastic IP
  if (API_URL.includes('98.95.79.84')) {
    console.error('  ❌ API_URL apunta a Elastic IP directamente!')
    console.error('     → Valor actual: ' + API_URL)
    console.error('     → Debe usar API Gateway: https://4vopem29wa.execute-api.us-east-1.amazonaws.com')
    hasErrors = true
  }
  
  // 4. Verificar que use HTTPS en producción
  if (NODE_ENV === 'production' && !API_URL.startsWith('https://')) {
    console.error('  ❌ API_URL debe usar HTTPS en producción!')
    console.error('     → Valor actual: ' + API_URL)
    hasErrors = true
  }
  
  // 5. Advertencia si incluye /api/v1 al final
  if (API_URL.endsWith('/api/v1')) {
    console.warn('  ⚠️  API_URL incluye /api/v1 al final')
    console.warn('     → Esto puede causar rutas duplicadas como /api/v1/api/v1/...')
    console.warn('     → Valor actual: ' + API_URL)
    console.warn('     → Debería ser: https://4vopem29wa.execute-api.us-east-1.amazonaws.com')
    hasWarnings = true
  }
  
  // 6. Verificar formato de API Gateway
  if (API_URL.includes('execute-api') && !API_URL.includes('amazonaws.com')) {
    console.error('  ❌ URL de API Gateway mal formada')
    console.error('     → Valor actual: ' + API_URL)
    hasErrors = true
  } else if (API_URL.includes('execute-api') && API_URL.includes('amazonaws.com')) {
    console.log('  ✅ Usando API Gateway correctamente')
  }
}

// 7. Verificar Cognito
if (!COGNITO_POOL) {
  console.error('  ❌ NEXT_PUBLIC_COGNITO_USER_POOL_ID no está definida')
  hasErrors = true
} else {
  console.log('  ✅ Cognito User Pool ID configurado')
  
  // Verificar que sea us-east-1
  if (!COGNITO_POOL.startsWith('us-east-1_')) {
    console.error('  ❌ User Pool debe estar en us-east-1')
    console.error('     → Valor actual: ' + COGNITO_POOL)
    console.error('     → Debe ser: us-east-1_PC9bJht8c')
    hasErrors = true
  } else {
    console.log('  ✅ User Pool en us-east-1 (correcto)')
  }
}

if (!COGNITO_REGION) {
  console.error('  ❌ NEXT_PUBLIC_COGNITO_REGION no está definida')
  hasErrors = true
} else if (COGNITO_REGION !== 'us-east-1') {
  console.error('  ❌ COGNITO_REGION debe ser us-east-1')
  console.error('     → Valor actual: ' + COGNITO_REGION)
  hasErrors = true
} else {
  console.log('  ✅ Cognito Region correcto (us-east-1)')
}

console.log()

// Resumen
if (hasErrors) {
  console.log('━'.repeat(70))
  console.error('❌ SE ENCONTRARON ERRORES EN LA CONFIGURACIÓN')
  console.error('   La aplicación NO funcionará correctamente en producción')
  console.log('━'.repeat(70))
  console.log()
  console.log('📝 CONFIGURACIÓN CORRECTA PARA AMPLIFY:')
  console.log('━'.repeat(70))
  console.log('   En AWS Amplify Console > App Settings > Environment Variables:')
  console.log()
  console.log('   NEXT_PUBLIC_API_URL=https://4vopem29wa.execute-api.us-east-1.amazonaws.com')
  console.log('   NEXT_PUBLIC_AWS_REGION=us-east-1')
  console.log('   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PC9bJht8c')
  console.log('   NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=umlcpsk5fmpctabjkh30tu44n')
  console.log('   NEXT_PUBLIC_COGNITO_REGION=us-east-1')
  console.log()
  console.log('   Después de configurar, haz un "Redeploy" de la aplicación')
  console.log('━'.repeat(70))
  
  // NO fallar el build, solo advertir
  // process.exit(1)
} else if (hasWarnings) {
  console.log('━'.repeat(70))
  console.warn('⚠️  HAY ADVERTENCIAS EN LA CONFIGURACIÓN')
  console.warn('   La aplicación puede funcionar pero con problemas')
  console.log('━'.repeat(70))
} else {
  console.log('━'.repeat(70))
  console.log('✅ CONFIGURACIÓN CORRECTA')
  console.log('   Todas las variables están configuradas apropiadamente')
  console.log('━'.repeat(70))
}

console.log()
console.log('='.repeat(70) + '\n')
