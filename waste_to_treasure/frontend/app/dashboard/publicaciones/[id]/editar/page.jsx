// Autor: Gabriel Florentino Reyes
// Fecha: 15-11-2025
// Descripción: Este archivo implementa la vista para editar una publicación existente en el dashboard. 
//              Permite al usuario modificar los datos de su publicación mediante el componente EditPublicationForm, 
//              utilizando el ID de la publicación recibido en los parámetros de la ruta.

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