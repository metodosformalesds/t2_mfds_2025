// components/dashboard/ProfileForm.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useProfile } from '@/hooks/useProfile';
import { Save, Loader2, AlertCircle, CheckCircle2, Upload, User, X } from 'lucide-react'; 
import { uploadService } from '@/lib/api/upload';

export default function ProfileForm() {
  const { profile, isLoading, error, updateProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        bio: profile.bio || '', // TODO: Agregar campo bio al backend
        currentPassword: '',
        newPassword: '',
      });
      
      // Cargar imagen de perfil existente
      if (profile.profile_image_url) {
        setProfileImagePreview(profile.profile_image_url);
      }
    }
  }, [profile]);

  // Configuración de dropzone para imagen de perfil
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('La imagen no debe superar 5MB');
        return;
      }
      
      // Validar tipo
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Solo se permiten imágenes JPG, PNG o WebP');
        return;
      }
      
      setProfileImage(file);
      setUploadError('');
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(profile?.profile_image_url || null);
    setUploadError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar mensajes al editar
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    setUploadError('');

    try {
      let profileImageUrl = profile?.profile_image_url || null;
      
      // Si hay una nueva imagen, subirla primero
      if (profileImage) {
        setIsUploadingImage(true);
        try {
          // Usar el nuevo endpoint específico para imágenes de perfil
          profileImageUrl = await uploadService.uploadProfileImage(profileImage);
        } catch (uploadErr) {
          setUploadError(uploadErr.message || 'Error al subir la imagen. Intenta de nuevo.');
          setIsSaving(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Actualizar perfil con la nueva imagen (si existe)
      const profileUpdateData = {
        full_name: formData.fullName,
        profile_image_url: profileImageUrl,
        bio: formData.bio,
      };

      await updateProfile(profileUpdateData);

      setSuccessMessage('Perfil actualizado correctamente');
      setProfileImage(null); // Limpiar imagen temporal
      setUploadError(''); // Limpiar errores
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  // Mostrar loader mientras carga el perfil inicial
  if (isLoading && !profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Mensajes de éxito/error */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-inter">{successMessage}</span>
        </div>
      )}

      {(errorMessage || error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-inter">{errorMessage || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Imagen de Perfil */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">
            Imagen de Perfil
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Preview de la imagen */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-sm">
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
                {profileImagePreview ? (
                  <Image
                    src={profileImagePreview}
                    alt="Imagen de perfil"
                    fill
                    className="object-cover"
                    unoptimized={profileImagePreview.startsWith('blob:')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Dropzone */}
            <div className="flex-1 w-full">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                } ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} disabled={isUploadingImage} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {isDragActive ? (
                  <p className="text-primary-600 font-inter font-medium">Suelta la imagen aquí...</p>
                ) : (
                  <>
                    <p className="text-gray-700 font-inter mb-1">
                      <span className="font-semibold text-primary-500">Haz clic</span> o arrastra una imagen
                    </p>
                    <p className="text-sm text-gray-500 font-inter">
                      JPG, PNG o WebP (máx. 5MB)
                    </p>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-inter">{uploadError}</span>
                </div>
              )}

              {profileImage && !isUploadingImage && (
                <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700 font-inter truncate">
                      {profileImage.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="ml-2 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                    aria-label="Quitar imagen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {isUploadingImage && (
                <div className="mt-3 flex items-center gap-2 text-primary-600 text-sm bg-primary-50 p-3 rounded-lg border border-primary-200">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="font-inter">Subiendo imagen...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Nombre Completo / Empresa
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ingresa tu nombre completo o empresa"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-inter text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Información de Vendedor (BIO) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
            Información de Vendedor (BIO)
          </h3>
          <p className="text-sm text-gray-600 mb-4 font-inter">
            Describe brevemente tu negocio o lo que vendes
          </p>

          {/* Mostrar BIO actual */}
          {profile?.bio && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2 font-inter uppercase">
                BIO actual (visible al público)
              </p>
              <p className="text-gray-700 font-inter whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {!profile?.bio && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-inter">
                No tienes una BIO configurada. Los compradores no verán información adicional sobre ti.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
              Actualizar BIO
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Ej: Vendo productos reciclados y artesanías..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter resize-none"
            />
          </div>
        </div>

        {/* Cambio de Contraseña */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
            Seguridad
          </h3>
          
          {/* Información sobre cambio de contraseña */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1 font-inter">
                  Cambiar Contraseña
                </h4>
                <p className="text-sm text-gray-600 mb-3 font-inter">
                  Para mantener tu cuenta segura, puedes cambiar tu contraseña en cualquier momento.
                </p>
                <a
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Cambiar mi contraseña
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
