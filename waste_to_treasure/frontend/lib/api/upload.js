/**
 * Servicio de Upload de Imágenes
 * 
 * Maneja la subida de imágenes a S3 a través del backend.
 * El backend se encarga de la comunicación con S3 y retorna las URLs.
 */

import apiClient from './client';

export const uploadService = {
  /**
   * Sube una imagen a S3
   * @param {File} file - Archivo de imagen a subir
   * @param {number} listingId - ID del listing (puede ser temporal)
   * @param {boolean} isPrimary - Si es la imagen principal
   * @returns {Promise<string>} URL de la imagen en S3
   */
  uploadImage: async (file, listingId, isPrimary = false) => {
    try {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no válido. Permitidos: ${validTypes.join(', ')}`);
      }

      // Validar tamaño (máx 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        throw new Error(`Archivo demasiado grande. Máximo: 5MB`);
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);

      // Llamar al endpoint
      const { data } = await apiClient.post(
        `/listings/upload-image?listing_id=${listingId}&is_primary=${isPrimary}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Timeout mayor para uploads grandes
          timeout: 30000, // 30 segundos
        }
      );

      return data.url;
    } catch (error) {
      // Extraer mensaje de error del backend
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }

      throw error;
    }
  },

  /**
   * Sube múltiples imágenes en secuencia
   * @param {File[]} files - Array de archivos a subir
   * @param {number} listingId - ID del listing
   * @param {number} primaryIndex - Índice de la imagen principal (default: 0)
   * @returns {Promise<string[]>} Array de URLs de las imágenes en S3
   */
  uploadMultipleImages: async (files, listingId, primaryIndex = 0) => {
    const uploadedUrls = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === primaryIndex;

      try {
        const url = await uploadService.uploadImage(file, listingId, isPrimary);
        uploadedUrls.push(url);
      } catch (error) {
        errors.push({
          fileName: file.name,
          error: error.message,
        });
      }
    }

    // Si hubo errores, informar al usuario
    if (errors.length > 0) {
      const errorMsg = errors
        .map(e => `${e.fileName}: ${e.error}`)
        .join('\n');
      
      // Si todas fallaron, lanzar error
      if (uploadedUrls.length === 0) {
        throw new Error('No se pudo subir ninguna imagen');
      }
    }

    return uploadedUrls;
  },

  /**
   * Valida archivos antes de subirlos
   * @param {File[]} files - Archivos a validar
   * @returns {Object} { valid: File[], invalid: {file: File, reason: string}[] }
   */
  validateFiles: (files) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const valid = [];
    const invalid = [];

    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        invalid.push({
          file,
          reason: `Tipo no válido: ${file.type}`,
        });
      } else if (file.size > maxSize) {
        invalid.push({
          file,
          reason: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máx 5MB)`,
        });
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid };
  },
};

export default uploadService;
