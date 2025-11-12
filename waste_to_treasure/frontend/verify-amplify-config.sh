#!/bin/bash
# Script de verificación pre-deploy para AWS Amplify
# Uso: chmod +x verify-amplify-config.sh && ./verify-amplify-config.sh

set -e

echo "🔍 Verificando configuración para AWS Amplify..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Función para error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Función para warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Función para success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "📂 Verificando archivos críticos..."
echo "-----------------------------------"

# Verificar amplify.yml
if [ -f "amplify.yml" ]; then
    success "amplify.yml existe"
    
    # Verificar contenido
    if grep -q "baseDirectory: .next" amplify.yml; then
        success "baseDirectory correcto (.next)"
    else
        error "baseDirectory incorrecto en amplify.yml (debe ser .next)"
    fi
    
    if grep -q "npm ci" amplify.yml; then
        success "Comando npm ci configurado"
    else
        warning "Se recomienda usar 'npm ci' en lugar de 'npm install'"
    fi
else
    error "amplify.yml no encontrado"
fi

# Verificar package.json
if [ -f "package.json" ]; then
    success "package.json existe"
    
    # Verificar scripts
    if grep -q '"build":' package.json; then
        success "Script 'build' configurado"
    else
        error "Script 'build' faltante en package.json"
    fi
    
    if grep -q '"start":' package.json; then
        success "Script 'start' configurado"
    else
        warning "Script 'start' faltante (recomendado)"
    fi
else
    error "package.json no encontrado"
fi

# Verificar next.config
if [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then
    success "next.config encontrado"
else
    error "next.config.mjs o next.config.js no encontrado"
fi

# Verificar .env.example
if [ -f ".env.example" ]; then
    success ".env.example existe"
else
    warning ".env.example no encontrado (recomendado para documentación)"
fi

# Verificar .gitignore
if [ -f ".gitignore" ]; then
    success ".gitignore existe"
    
    if grep -q ".env.local" .gitignore; then
        success ".env.local en .gitignore"
    else
        error ".env.local NO está en .gitignore (riesgo de seguridad)"
    fi
    
    if grep -q ".next" .gitignore; then
        success ".next en .gitignore"
    else
        warning ".next debería estar en .gitignore"
    fi
else
    error ".gitignore no encontrado"
fi

echo ""
echo "🔐 Verificando variables de entorno necesarias..."
echo "------------------------------------------------"

# Lista de variables requeridas
REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_AWS_REGION"
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID"
    "NEXT_PUBLIC_COGNITO_APP_CLIENT_ID"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

echo "Variables requeridas para configurar en Amplify:"
for var in "${REQUIRED_VARS[@]}"; do
    echo "  - $var"
done

echo ""
echo "⚙️  Verificando dependencias..."
echo "------------------------------"

if [ -f "package.json" ]; then
    # Verificar dependencias críticas
    CRITICAL_DEPS=("next" "react" "react-dom" "aws-amplify" "@stripe/stripe-js")
    
    for dep in "${CRITICAL_DEPS[@]}"; do
        if grep -q "\"$dep\":" package.json; then
            success "$dep instalado"
        else
            error "$dep faltante en package.json"
        fi
    done
fi

echo ""
echo "📦 Verificando estructura de directorios..."
echo "------------------------------------------"

# Verificar directorios críticos
CRITICAL_DIRS=("app" "components" "lib" "public")

for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "Directorio $dir/ existe"
    else
        warning "Directorio $dir/ no encontrado"
    fi
done

echo ""
echo "🧪 Probando build local..."
echo "-------------------------"

if [ -f "package.json" ]; then
    echo "Ejecutando: npm run build (esto puede tardar...)"
    
    if npm run build > /tmp/build.log 2>&1; then
        success "Build exitoso ✨"
    else
        error "Build falló. Ver logs: /tmp/build.log"
        echo ""
        echo "Últimas líneas del error:"
        tail -20 /tmp/build.log
    fi
else
    error "No se puede probar build sin package.json"
fi

echo ""
echo "📊 Resumen de verificación"
echo "=========================="
echo ""

if [ $ERRORS -eq 0 ]; then
    success "✨ Todo listo para deploy en AWS Amplify!"
    echo ""
    echo "Próximos pasos:"
    echo "1. Push tu código a GitHub"
    echo "2. Conecta tu repo en AWS Amplify Console"
    echo "3. Configura las variables de entorno en Amplify"
    echo "4. Deploy! 🚀"
    exit 0
else
    error "Se encontraron $ERRORS errores que deben corregirse"
    if [ $WARNINGS -gt 0 ]; then
        warning "También hay $WARNINGS warnings (opcional corregir)"
    fi
    echo ""
    echo "❌ Corrige los errores antes de deployar"
    exit 1
fi
