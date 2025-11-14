// components/dashboard/ProfileForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link'; 

export default function ProfileForm() {
  const { profile, isLoading, error, updateProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    fullName: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
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
                Nombre Completo
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ingresa tu nombre completo"
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
              <p className="mt-1 text-xs text-gray-500 font-inter">
                El correo electrónico se gestiona desde AWS Cognito y no se puede cambiar aquí
              </p>
            </div>
          </div>
        </div>

        {/* Información de la Cuenta */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">
            Información de la Cuenta
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                ID de Usuario
              </label>
              <input
                type="text"
                value={profile?.user_id || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-inter text-gray-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Rol
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-inter text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Estado
              </label>
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-100">
                <div className={`w-2 h-2 rounded-full ${profile?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-inter text-gray-500">
                  {profile?.status === 'ACTIVE' ? 'Activo' : profile?.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 font-inter">
            El rol y estado de tu cuenta solo pueden ser modificados por un administrador
          </p>
        </div>

        {/* Cambio de Contraseña (Redirección a Cognito) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
            Cambiar Contraseña
          </h3>
          <p className="text-sm text-gray-600 mb-4 font-inter">
            Para cambiar tu contraseña, debes hacerlo a través de AWS Cognito.
          </p>

          {/* Enlace corregido */}
          <Link
            href="/change-password" // TODO: Crear esta página o modal con Cognito
            className="inline-flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-inter"
          >
            Cambiar Contraseña
          </Link>
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
