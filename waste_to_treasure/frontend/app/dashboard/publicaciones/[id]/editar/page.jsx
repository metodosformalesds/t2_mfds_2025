'use client'

import { use } from 'react'
import EditPublicationForm from '@/components/dashboard/EditPublicationForm'

export default function EditPublicationPage({ params }) {
  const resolvedParams = use(params)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-black text-3xl font-poppins font-semibold">
          Editar Publicación
        </h1>
        <p className="text-gray-600 font-inter mt-2">
          Modifica la información de tu publicación
        </p>
      </div>
      <EditPublicationForm listingId={resolvedParams.id} />
    </div>
  )
}