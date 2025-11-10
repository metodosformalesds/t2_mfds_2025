import Link from 'next/link'

export default function FaqCta() {
  return (
    <div className="mt-16 rounded-3xl bg-primary-500 px-8 py-12 text-center shadow-lg">
      <h2 className="font-poppins text-4xl font-semibold text-white">
        ¿No encontraste lo que buscabas?
      </h2>
      <p className="mx-auto mt-4 max-w-xl font-inter text-lg text-white/90">
        Nuestro equipo de soporte está listo para ayudarte con cualquier pregunta
      </p>
      <Link
        href="/contact"
        className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-500 transition-transform hover:scale-105"
      >
        Contactar Soporte
      </Link>
    </div>
  )
}