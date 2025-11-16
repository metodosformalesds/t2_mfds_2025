/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: Cta
 * Descripción: sección de llamada a la acción que invita a los usuarios a explorar los planes de negocio disponibles con título, descripción y botón de enlace
 */

import Link from 'next/link'

export default function Cta() {
  return (
    <section className="bg-neutral-100 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
          Únete a la sostenibilidad
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600">
          Ya seas una empresa buscando reducir desperdicio o un artesano en
          busca de materiales, tenemos un plan para ti.
        </p>
        <div className="mt-10">
          <Link
            href="/plans"
            className="rounded-lg bg-secondary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-secondary-500"
          >
            Ver planes de negocio
          </Link>
        </div>
      </div>
    </section>
  )
}