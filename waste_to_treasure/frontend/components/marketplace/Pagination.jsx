'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Pagination component for materials catalog
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 */
export default function Pagination({ currentPage = 1, totalPages = 5, onPageChange }) {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page)
    }
  }

  const renderPageNumbers = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`flex h-[50px] min-w-[50px] items-center justify-center rounded-lg border-2 px-5 py-3 font-inter text-base font-semibold transition-colors ${
            currentPage === i
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-neutral-300 bg-white text-black hover:border-neutral-400'
          }`}
        >
          {i}
        </button>
      )
    }
    return pages
  }

  return (
    <div className="flex items-center gap-5">
      {/* Anterior Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-[50px] items-center gap-2 rounded-lg border-2 border-neutral-300 bg-white px-5 py-3 font-inter text-base font-semibold text-black transition-colors hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronsLeft size={25} />
        Anterior
      </button>

      {/* Page Numbers */}
      {renderPageNumbers()}

      {/* Siguiente Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-[50px] items-center gap-2 rounded-lg border-2 border-neutral-300 bg-white px-5 py-3 font-inter text-base font-semibold text-black transition-colors hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
        <ChevronsRight size={25} />
      </button>
    </div>
  )
}
