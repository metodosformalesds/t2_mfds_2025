#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

# Ejecutar las migraciones de Alembic
echo "INFO: Ejecutando migraciones de la base de datos..."
alembic upgrade head

# Iniciar el servidor de producción (Gunicorn + Uvicorn)
echo "INFO: Iniciando el servidor Gunicorn..."
exec gunicorn -k uvicorn.workers.UvicornWorker -w 3 app.main:app --bind 0.0.0.0:8000