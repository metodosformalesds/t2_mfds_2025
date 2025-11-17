// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Descripción: Vista de gestión de perfil del usuario
//              Permite actualizar información personal y ajustes de la cuenta
//              Renderiza el formulario de edición del perfil

import ProfileForm from '@/components/dashboard/ProfileForm';

export const metadata = {
  title: 'Gestión de Perfil - Waste to Treasure',
  description: 'Actualiza tu información personal y configuración de cuenta.',
};

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-black text-3xl font-poppins font-semibold">
        Gestión de Perfil
      </h1>
      <ProfileForm />
    </div>
  );
}