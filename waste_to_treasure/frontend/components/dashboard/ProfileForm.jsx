// components/dashboard/ProfileForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'; 

export default function ProfileForm() {
  const { profile, isLoading, error, updateProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
  });

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
    }
  }, [profile]);

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

    try {
      // Actualizar perfil
      const profileUpdateData = {
        full_name: formData.fullName,
        // TODO: Agregar bio cuando esté disponible en el backend
        // bio: formData.bio,
      };

      await updateProfile(profileUpdateData);

      setSuccessMessage('Perfil actualizado correctamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al actualizar el perfil');
      console.error('Error al guardar:', err);
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">
            Contraseña
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Contraseña
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Contraseña actual"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Nueva contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter"
              />
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
