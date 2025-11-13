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
            “{item.description}”
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
          Razón de rechazo (si aplica):
        </label>
        <textarea
          id="rejectionReason"
          value={rejectionReason}
          onChange={(e) => {
            console.log('[ModerationDetail] Razón actualizada:', e.target.value)
            onReasonChange(e)
          }}
          placeholder="Ej: Imagen no clara, descripción incompleta"
          rows={3}
          className="mt-2 w-full rounded-xl border border-neutral-900 bg-white px-4 py-2.5 font-inter text-neutral-900/70 placeholder-neutral-900/70 focus:ring-2 focus:ring-primary-500"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {/* Botones de Acción */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => {
            console.log('[ModerationDetail] Botón APROBAR clickeado')
            console.log('[ModerationDetail] Item:', item)
            onApprove()
          }}
          className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600"
        >
          Aprobar
        </button>
        <button
          onClick={() => {
            console.log('[ModerationDetail] Botón RECHAZAR clickeado')
            console.log('[ModerationDetail] Item:', item)
            console.log('[ModerationDetail] Razón:', rejectionReason)
            onReject()
          }}
          className="rounded-lg bg-secondary-600 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-secondary-500"
        >
          Rechazar
        </button>
      </div>
    </div>
  )
}