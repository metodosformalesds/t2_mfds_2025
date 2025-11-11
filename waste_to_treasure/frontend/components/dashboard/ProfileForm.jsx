'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Save } from 'lucide-react';

export default function ProfileForm() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    bio: '',
    password: '',
    newPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Guardar cambios:', formData);
      // TODO: Aquí irá la conexión con el backend
      // await updateProfile(formData);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre y Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
              Nombre Completo/Empresa
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter"
              required
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
            Información de Vendedor (BIO)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Cuéntanos sobre ti o tu negocio..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-inter"
          />
          <p className="mt-1 text-xs text-gray-500 font-inter">
            Esta información será visible en tu perfil público
          </p>
        </div>

        {/* Contraseñas */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">
            Cambiar Contraseña
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">
                Contraseña Actual
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña actual"
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
                placeholder="Ingresa tu nueva contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-inter"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 font-inter">
            Deja estos campos vacíos si no deseas cambiar tu contraseña
          </p>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}