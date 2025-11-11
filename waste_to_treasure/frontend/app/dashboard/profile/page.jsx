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