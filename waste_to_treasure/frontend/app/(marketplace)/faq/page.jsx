'use client'

import { useState, useMemo } from 'react'
import FaqHeader from '@/components/faq/FaqHeader'
import FaqTabs from '@/components/faq/FaqTabs'
import FaqList from '@/components/faq/FaqList'
import FaqCta from '@/components/faq/FaqCta'
import { faqCategories, faqsByCategory, allFaqs } from '@/lib/data/faqData'

/**
 * Normaliza texto para búsqueda (quita acentos, lowercase)
 */
const normalizeText = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [searchTerm, setSearchTerm] = useState('')

  // Lógica para manejar el cambio de pestaña
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchTerm('') // Limpiamos la búsqueda al cambiar de pestaña
  }

  // Lógica para manejar la búsqueda
  const handleSearch = (term) => {
    setSearchTerm(term)
    if (term) {
      setActiveTab(null) // Desactivamos las pestañas si hay un término de búsqueda
    } else {
      setActiveTab('general') // Volvemos a 'General' si la búsqueda está vacía
    }
  }

  // Calcular qué preguntas mostrar
  const { title, questions } = useMemo(() => {
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm)
      
      const results = allFaqs.filter(
        faq =>
          normalizeText(faq.q).includes(normalizedSearch) ||
          normalizeText(faq.a).includes(normalizedSearch)
      )

      return {
        title: `Resultados para "${searchTerm}"`,
        questions: results,
      }
    }

    // Si no hay búsqueda, mostramos la pestaña activa
    const activeCategory = faqCategories.find(c => c.id === activeTab) || faqCategories[0]
    return {
      title: activeCategory.name,
      questions: faqsByCategory[activeTab] || [],
    }
  }, [activeTab, searchTerm])

  return (
    <div className="bg-neutral-50">
      {/* 1. Hero Verde con Buscador */}
      <FaqHeader onSearch={handleSearch} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* 2. Pestañas de Navegación */}
          <FaqTabs
            categories={faqCategories}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          {/* 3. Lista de Preguntas (Acordeón) */}
          <FaqList
            key={activeTab || searchTerm}
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