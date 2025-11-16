'use client'

import Image from 'next/image'
import { Package, User, Calendar, DollarSign, Tag } from 'lucide-react'

export default function ModerationDetail({
  item,
  rejectionReason,
  onReasonChange,
  onApprove,
  onReject,
  error,
}) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
        <h2 className="font-poppins text-2xl font-bold text-neutral-900 line-clamp-2">
          {item.title}
        </h2>
      </div>
      
      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Metadatos en cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {item.category && (
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-600 mb-1">
                <Tag className="h-4 w-4" />
                <span className="text-xs font-medium">Categoría</span>
              </div>
              <p className="text-sm font-semibold text-neutral-900">{item.category}</p>
            </div>
          )}
          
          {item.price && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Precio</span>
              </div>
              <p className="text-sm font-bold text-green-900">
                ${parseFloat(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Vendedor</span>
            </div>
            <p className="text-sm font-semibold text-blue-900 truncate">{item.user}</p>
          </div>
          
          {item.createdAt && (
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Publicado</span>
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                {new Date(item.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div>
          <h3 className="font-inter text-sm font-semibold text-neutral-700 mb-2">
            Descripción del producto
          </h3>
          <p className="font-inter text-sm text-neutral-900 leading-relaxed bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            {item.description}
          </p>
        </div>

        {/* Galería de Imágenes */}
        <div>
          <h3 className="font-inter text-sm font-semibold text-neutral-700 mb-3">
            Imágenes de la publicación
          </h3>
          {item.images && item.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {item.images.map((imgSrc, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                >
                  <Image
                    src={imgSrc}
                    alt={`Imagen ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-lg border border-neutral-200">
              <Package className="h-12 w-12 text-neutral-400 mb-2" />
              <p className="font-inter text-sm text-neutral-500">
                Sin imágenes disponibles
              </p>
            </div>
          )}
        </div>

        {/* Razón de Rechazo */}
        <div className="pt-4 border-t border-neutral-200">
          <label
            htmlFor="rejectionReason"
            className="block font-inter text-sm font-semibold text-neutral-700 mb-2"
          >
            Razón de rechazo <span className="text-red-600">*</span>
            <span className="text-xs font-normal text-neutral-600 ml-1">
              (obligatoria para rechazar)
            </span>
          </label>
          <textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ej: Imagen no clara, descripción incompleta, contenido inapropiado..."
            rows={3}
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-inter text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800 font-inter">{error}</p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 pt-4">
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
    </div>
  )
}