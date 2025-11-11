'use client'

/**
 * Specifications Table Component
 * Displays material/product technical specifications
 * Data comes from listing description and origin_description from backend
 */
export default function SpecificationsTable({ listing }) {
  // Build specifications from backend listing data
  const specifications = [
    {
      label: 'Categoría',
      value: listing?.category_id ? `ID: ${listing.category_id}` : 'N/A',
    },
    {
      label: 'Tipo',
      value: listing?.listing_type === 'MATERIAL' ? 'Material' : 'Producto',
    },
    {
      label: 'Origen/Descripción',
      value: listing?.origin_description || 'No especificado',
    },
    {
      label: 'Cantidad disponible',
      value: `${listing?.quantity || 0} ${listing?.price_unit || 'unidades'}`,
    },
    {
      label: 'Estado',
      value:
        listing?.status === 'ACTIVE'
          ? 'Activo'
          : listing?.status === 'PENDING'
            ? 'Pendiente'
            : 'Inactivo',
    },
  ]

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-6">
      <h3 className="mb-4 font-roboto text-xl font-bold text-neutral-900">
        Especificaciones Técnicas
      </h3>
      <div className="space-y-3">
        {specifications.map((spec, index) => (
          <div
            key={index}
            className="flex items-start justify-between border-b border-neutral-200 pb-3 last:border-0"
          >
            <span className="font-inter text-sm text-neutral-600">{spec.label}</span>
            <span className="max-w-[60%] text-right font-inter text-sm font-medium text-neutral-900">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
