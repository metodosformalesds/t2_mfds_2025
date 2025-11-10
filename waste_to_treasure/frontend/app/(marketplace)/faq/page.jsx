'use client'

import { useState, useMemo } from 'react'
import FaqHeader from '@/components/faq/FaqHeader'
import FaqTabs from '@/components/faq/FaqTabs'
import FaqList from '@/components/faq/FaqList'
import FaqCta from '@/components/faq/FaqCta'
// Importamos los datos de mock
import {
  faqCategories,
  allFaqs,
  searchableFaqs,
} from '@/components/faq/mockData'

/**
 * Helper function to normalize text:
 * 1. Converts to lowercase.
 * 2. Decomposes diacritics (e.g., 'é' -> 'e' + '´').
 * 3. Removes diacritical marks.
 * 4. Trims whitespace.
 * @param {string} text The string to normalize.
 * @returns {string} The normalized string.
 */
const normalizeText = text => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres (ej. 'é' se vuelve 'e' y '´')
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos (diacríticos)
    .trim()
}

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [searchTerm, setSearchTerm] = useState('')

  // Lógica para manejar el cambio de pestaña
  const handleTabChange = tabId => {
    setActiveTab(tabId)
    setSearchTerm('') // Limpiamos la búsqueda al cambiar de pestaña
  }

  // Lógica para manejar la búsqueda
  const handleSearch = term => {
    setSearchTerm(term)
    if (term) {
      setActiveTab(null) // Desactivamos las pestañas si hay un término de búsqueda
    } else {
      setActiveTab('general') // Volvemos a 'General' si la búsqueda está vacía
    }
  }

  // hook useMemo para calcular qué preguntas mostrar
  const { title, questions } = useMemo(() => {
    if (searchTerm) {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Usamos la función normalizeText para el término de búsqueda
      const normalizedSearch = normalizeText(searchTerm)
      
      const results = searchableFaqs.filter(
        faq =>
          // Y también normalizamos el texto de la pregunta y respuesta
          normalizeText(faq.q).includes(normalizedSearch) ||
          normalizeText(faq.a).includes(normalizedSearch)
      )
      // --- FIN DE LA MODIFICACIÓN ---

      return {
        title: `Resultados para "${searchTerm}"`,
        questions: results,
      }
    }

    // Si no hay búsqueda, mostramos la pestaña activa
    const activeCategory =
      faqCategories.find(c => c.id === activeTab) || faqCategories[0]
    return {
      title: activeCategory.name,
      questions: allFaqs[activeTab] || [],
    }
  }, [activeTab, searchTerm])

  return (
    <div className="bg-neutral-50">
      {/* 1. Hero Verde con Buscador (ahora funcional) */}
      <FaqHeader onSearch={handleSearch} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* 2. Pestañas de Navegación (ahora controladas) */}
          <FaqTabs
            categories={faqCategories}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          {/* 3. Lista de Preguntas (Acordeón) */}
          <FaqList
            key={activeTab || searchTerm} // Forzar re-render
            title={title}
            questions={questions}
            isSearchResult={!!searchTerm}
          />

          {/* 4. Bloque CTA "No encontraste..." */}
          <FaqCta />
        </div>
      </div>
    </div>
  )
}