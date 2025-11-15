#!/bin/bash
#
# Script para actualizar el backend en EC2
# Uso: ./deploy-ec2.sh
#

set -e  # Salir si hay error

echo "🚀 Iniciando actualización del backend..."
echo ""

# 1. Pull del código
echo "📥 1/5 - Descargando código actualizado..."
git pull origin main
echo "✅ Código actualizado"
echo ""

# 2. Detener contenedor
echo "🛑 2/5 - Deteniendo contenedor actual..."
docker stop w2t-api || true
docker rm w2t-api || true
echo "✅ Contenedor detenido"
echo ""

# 3. Build de la imagen
echo "🔨 3/5 - Construyendo nueva imagen..."
docker build -t w2t-backend .
echo "✅ Imagen construida"
echo ""

# 4. Verificar .env.prod
echo "🔍 4/5 - Verificando configuración..."
if [ -f .env.prod ]; then
    echo "Configuración CORS actual:"
    grep BACKEND_CORS_ORIGINS .env.prod || echo "⚠️  BACKEND_CORS_ORIGINS no encontrado"
    echo ""
    echo "✅ Debe ser: BACKEND_CORS_ORIGINS=[\"http://localhost:3000\",\"https://main.d20d0dqywsvuyq.amplifyapp.com\"]"
    echo "   (SIN barra final en Amplify URL)"
    echo ""
else
    echo "❌ ERROR: .env.prod no existe"
    exit 1
fi

# 5. Iniciar contenedor
echo "▶️  5/5 - Iniciando contenedor..."
docker run -d \
    -p 8000:8000 \
    --env-file .env.prod \
    --name w2t-api \
    --restart always \
    w2t-backend
echo "✅ Contenedor iniciado"
echo ""

# Esperar 3 segundos
echo "⏳ Esperando 3 segundos..."
sleep 3
echo ""

# Mostrar logs
echo "📋 Logs del contenedor (presiona Ctrl+C para salir):"
echo "─────────────────────────────────────────────────────"
docker logs -f w2t-api
