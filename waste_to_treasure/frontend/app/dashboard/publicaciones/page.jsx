import PublicationsList from '@/components/dashboard/PublicationsList'

export const metadata = {
  title: 'Mis Publicaciones - Waste to Treasure',
  description: 'Gestiona tus publicaciones activas, pendientes e inactivas.',
}

export default function MyPublicationsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Este componente ahora contiene toda la lógica de la vista */}
      <PublicationsList />
    </div>
  )
}