/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: ModerationQueue
 * Descripción: lista de items pendientes de moderación con selección de item, paginación y estados de carga
 */

'use client'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import Image from 'next/image'

export default function ModerationQueue({ 
  items, 
  selectedId, 
  onSelectItem,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white border border-neutral-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-neutral-200 p-8">
        <p className="font-inter text-base text-neutral-600 text-center">
          No hay ítems en la cola.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <h3 className="font-inter text-sm font-semibold text-neutral-700">
          Cola de moderación
        </h3>
      </div>
      
      {/* Lista de items */}
      <div className="flex flex-col divide-y divide-neutral-200 max-h-[600px] overflow-y-auto">
        {items.map(item => {
          const isSelected = item.id === selectedId
          // Obtener la primera imagen si existe
          const thumbnail = item.images?.[0] || null
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={clsx(
                'w-full cursor-pointer p-4 text-left transition-all hover:bg-neutral-50',
                isSelected && 'bg-primary-50 border-l-4 border-l-primary-500'
              )}
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden relative">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-neutral-400" />
                    </div>
                  )}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-inter text-sm font-semibold text-neutral-900 line-clamp-2 mb-1">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-inter text-xs text-neutral-600">
                      {item.publisher}
                    </span>
                    
                    {item.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-200 text-neutral-700">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {item.price && (
                    <p className="mt-1 font-roboto text-sm font-semibold text-primary-600">
                      ${parseFloat(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = idx + 1
                } else if (currentPage <= 3) {
                  pageNumber = idx + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + idx
                } else {
                  pageNumber = currentPage - 2 + idx
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={clsx(
                      'h-8 w-8 rounded-lg font-inter text-sm font-medium transition-colors',
                      currentPage === pageNumber
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors',
                currentPage === totalPages
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}