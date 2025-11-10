'use client'

export default function FaqTabs({ categories, activeTab, setActiveTab }) {
  return (
    <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => setActiveTab(category.id)}
          className={`rounded-full px-5 py-2 font-inter text-base font-medium transition-colors ${
            activeTab === category.id // Solo se activa si el ID coincide
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-neutral-100 text-neutral-900 ring-1 ring-neutral-300 hover:bg-neutral-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}