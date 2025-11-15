'use client'

import Image from 'next/image'

export default function ModerationDetail({
  item,
  rejectionReason,
  onReasonChange,
  onApprove,
  onReject,
  error,
}) {
  return (
    <div className="rounded-xl bg-white p-8 shadow-md">
      {/* Título */}
      <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
        {item.title}
      </h2>

      {/* Metadatos */}
      <div className="mt-4 flex flex-wrap gap-4 items-center">
        {item.category && (
          <span className="inline-flex items-center gap-2 font-inter text-sm bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full">
            <span className="font-medium">Categoría:</span> {item.category}
          </span>
        )}
        {item.price && (
          <span className="inline-flex items-center gap-2 font-roboto text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">
            <span className="font-normal">Precio:</span> ${item.price}
          </span>
        )}
        {item.createdAt && (
          <span className="inline-flex items-center gap-2 font-inter text-sm bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full">
            <span className="font-medium">Publicado:</span> {new Date(item.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Detalles del Usuario */}
      <div className="mt-6 space-y-2">
        <div>
          <h3 className="font-roboto text-lg font-medium text-neutral-900">
            Usuario:
          </h3>
          <p className="font-inter text-sm text-neutral-700">{item.user}</p>
        </div>
        <div>
          <h3 className="font-roboto text-lg font-medium text-neutral-900">
            Descripción:
          </h3>
          <p className="font-inter text-sm text-neutral-700">
            "{item.description}"
          </p>
        </div>
      </div>

      {/* Galería de Imágenes */}
      <div className="mt-6 flex flex-wrap gap-4">
        {item.images.map((imgSrc, index) => (
          <div
            key={index}
            className="relative h-36 w-48 overflow-hidden rounded-lg"
          >
            <Image
              src={imgSrc}
              alt={`Imagen de moderación ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className="bg-neutral-100"
            />
          </div>
        ))}
        {item.images.length === 0 && (
          <p className="font-inter text-sm text-neutral-500">
            (Sin imágenes)
          </p>
        )}
      </div>

      {/* Razón de Rechazo */}
      <div className="mt-8">
        <label
          htmlFor="rejectionReason"
          className="block font-roboto text-lg font-medium text-neutral-900"
        >
          Razón de rechazo (obligatoria para rechazar):
        </label>
        <textarea
          id="rejectionReason"
          value={rejectionReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ej: Imagen no clara, descripción incompleta, contenido inapropiado..."
          rows={3}
          className="mt-2 w-full rounded-xl border border-neutral-900 bg-white px-4 py-2.5 font-inter text-neutral-900/70 placeholder-neutral-900/70 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800 font-inter">{error}</p>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={onApprove}
          className="flex-1 rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Aprobar publicación
        </button>
        <button
          onClick={onReject}
          className="flex-1 rounded-lg bg-secondary-600 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
        >
          Rechazar publicación
        </button>
      </div>
    </div>
  )
}