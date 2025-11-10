'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

export default function FaqHeader({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <div className="w-full rounded-b-lg bg-primary-500 px-4 py-16 text-center text-white shadow-lg">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-poppins text-5xl font-bold">
          ¿Cómo podemos ayudarte?
        </h1>
        <p className="mt-5 font-inter text-base">
          Busca respuestas a tus preguntas sobre nuestra plataforma de economía
          circular
        </p>

        {/* Barra de Búsqueda */}
        <form
          onSubmit={handleSubmit}
          className="relative mx-auto mt-8 max-w-xl"
        >
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar preguntas..."
            className="w-full rounded-lg border-none py-4 pl-12 pr-32 text-base text-neutral-900 placeholder-neutral-500 ring-2 ring-transparent transition-all focus:ring-secondary-600"
          />
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Buscar
          </button>
        </form>
      </div>
    </div>
  )
}