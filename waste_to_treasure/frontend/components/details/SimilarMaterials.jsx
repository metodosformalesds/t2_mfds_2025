/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 10/11/2024
 * Componente: SimilarMaterials
 * Descripción: Muestra carrusel de materiales o productos similares basados en categoría.
 *              Renderiza hasta 4 items similares usando MaterialCard. Datos obtenidos
 *              de la API de listings con filtro de categoría.
 */

'use client'

import MaterialCard from '@/components/marketplace/MaterialCard'

export default function SimilarMaterials({ materials = [], title = 'Materiales Similares' }) {
  if (materials.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg bg-white p-6">
      <h3 className="mb-6 font-roboto text-2xl font-bold text-neutral-900">{title}</h3>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {materials.slice(0, 4).map((material) => (
          <MaterialCard
            key={material.listing_id}
            material={{
              id: material.listing_id,
              title: material.title,
              seller: material.seller_id,
              price: parseFloat(material.price),
              unit: material.price_unit || 'unidad',
              available: material.quantity,
              unit_measure: material.price_unit || 'unidad',
              isResidue: material.listing_type === 'MATERIAL',
              imageUrl: material.primary_image_url || '/placeholder-material.jpg',
            }}
          />
        ))}
      </div>
    </div>
  )
}
