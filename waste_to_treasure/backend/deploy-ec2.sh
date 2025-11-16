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
echo "🔨 3/6 - Construyendo nueva imagen..."
docker build -t w2t-backend .
echo "✅ Imagen construida"
echo ""

# 4. Ejecutar migraciones de base de datos
echo "🗄️  4/6 - Ejecutando migraciones de base de datos..."
if [ -f .env.prod ]; then
    # Ejecutar migraciones con las variables de entorno de producción
    set -a
    source .env.prod
    set +a
    
    # Ejecutar alembic upgrade dentro del contenedor de Python local o con Docker
    docker run --rm --env-file .env.prod w2t-backend alembic upgrade head
    
    if [ $? -eq 0 ]; then
        echo "✅ Migraciones aplicadas exitosamente"
    else
        echo "❌ ERROR: Fallo en migraciones de base de datos"
        echo "⚠️  Continuar con el deploy? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Deploy cancelado"
            exit 1
        fi
    fi
else
    echo "⚠️  Advertencia: .env.prod no encontrado, saltando migraciones"
fi
echo ""

# 5. Verificar .env.prod
echo "🔍 5/6 - Verificando configuración..."
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

# 6. Iniciar contenedor
echo "▶️  6/6 - Iniciando contenedor..."
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
