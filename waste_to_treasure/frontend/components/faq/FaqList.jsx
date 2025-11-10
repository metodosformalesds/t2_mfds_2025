import FaqItem from './FaqItem'

export default function FaqList({
  title,
  questions = [],
  isSearchResult = false,
}) {
  return (
    <div className="mb-16">
      <h2 className="mb-8 border-b-4 border-primary-500 pb-4 font-poppins text-4xl font-semibold text-neutral-900">
        {title}
      </h2>

      {questions.length > 0 ? (
        <div className="divide-y divide-neutral-300">
          {questions.map((faq, index) => (
            <FaqItem key={index} question={faq.q} answer={faq.a} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center font-inter text-lg text-neutral-600">
          {/* Mensaje diferente si es una búsqueda vs. una pestaña vacía */}
          {isSearchResult
            ? 'No se encontraron resultados. Intenta con otras palabras.'
            : 'No hay preguntas en esta categoría todavía.'}
        </p>
      )}
    </div>
  )
}