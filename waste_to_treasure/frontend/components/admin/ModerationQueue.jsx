'use client'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
      <div className="rounded-xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="font-inter text-base text-neutral-600 text-center">
          No hay ítems en la cola.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Lista de items */}
      <div className="p-4 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
        {items.map(item => {
          const isSelected = item.id === selectedId
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={clsx(
                'w-full cursor-pointer rounded-lg p-4 text-left transition-all',
                isSelected
                  ? 'border-l-4 border-primary-500 bg-primary-50 shadow-sm'
                  : 'bg-neutral-50 hover:bg-neutral-100 hover:shadow-sm'
              )}
            >
              <h3 className="font-inter text-base font-semibold text-neutral-900 line-clamp-2">
                {item.title}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-inter text-sm text-neutral-600">
                  Por: {item.publisher}
                </p>
                {item.category && (
                  <span className="font-inter text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded">
                    {item.category}
                  </span>
                )}
              </div>
              {item.price && (
                <p className="mt-1 font-roboto text-sm font-medium text-primary-600">
                  ${item.price}
                </p>
              )}
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