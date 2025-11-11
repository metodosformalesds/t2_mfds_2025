# -----
# ETAPA 1: Construcción y dependencias
# -----
# Usamos tu versión de Python
FROM python:3.13.9-slim AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Actualizamos los paquetes de Debian e instalamos las herramientas de compilación.
RUN apt-get update && apt-get install -y build-essential gcc

# Actualizamos pip
RUN pip install --upgrade pip

# Copiamos SOLO el archivo de requirements
COPY requirements.txt .

# Instalamos las dependencias
RUN pip wheel --no-cache-dir -r requirements.txt -w /tmp/wheels

# -----
# ETAPA 2: Producción
# -----
FROM python:3.13.9-slim

# Creamos un usuario no-root por seguridad
RUN useradd --create-home --shell /bin/bash appuser

# Establecemos el directorio de trabajo
WORKDIR /home/appuser/app

# Copiamos las dependencias pre-compiladas de la etapa anterior
COPY --from=builder /tmp/wheels /tmp/wheels

# Copiamos el requirements.txt
COPY requirements.txt .

# INSTALAMOS DEPENDENCIAS COMO ROOT (para que alembic esté disponible globalmente)
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels -r requirements.txt

# Copiamos el código fuente de la aplicación
COPY ./alembic.ini .
COPY ./alembic ./alembic
COPY ./app ./app

# Copiamos el entrypoint y le damos permisos de ejecución
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Damos ownership de todos los archivos al usuario appuser
RUN chown -R appuser:appuser /home/appuser/app

# Ahora sí, cambiamos al usuario no-root
USER appuser

# Exponemos el puerto en el que correrá Gunicorn
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["./entrypoint.sh"]