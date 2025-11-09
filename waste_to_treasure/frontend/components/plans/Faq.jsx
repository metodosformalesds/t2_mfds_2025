import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const faqs = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí, puedes actualizar o cambiar tu plan cuando lo desees. Los cambios se aplicarán inmediatamente y se ajustará el cobro proporcionalmente.',
  },
  {
    q: '¿Ofrecen periodo de prueba?',
    a: 'Los planes Pro y Empresarial incluyen 14 días de prueba gratis. No se requiere tarjeta de crédito para comenzar.',
  },
  {
    q: '¿Cómo se calculan las comisiones?',
    a: 'Las comisiones se aplican automáticamente sobre cada transacción completada. El porcentaje varía según tu plan: 10% Básico, 8% Pro, 6% Empresarial.',
  },
  {
    q: '¿Qué incluye el soporte prioritario?',
    a: 'Acceso directo por chat en vivo con tiempo de respuesta menores a 2 horas durante horario laboral, además de soporte por email 24/7.',
  },
]

export default function Faq() {
  return (
    <section className="bg-neutral-100 pb-24 pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-12 shadow-lg">
          <h2 className="mb-12 text-center font-poppins text-4xl font-bold text-neutral-900">
            Preguntas frecuentes
          </h2>

          {/* Grid de Preguntas */}
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
            {faqs.map(faq => (
              <div key={faq.q}>
                <h3 className="mb-3 font-roboto text-2xl font-bold text-neutral-900">
                  {faq.q}
                </h3>
                <p className="font-roboto text-xl text-neutral-700">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Enlace a todas las FAQs */}
          <div className="mt-16 text-center">
            <Link
              href="/faq"
              className="group inline-flex items-center gap-3 border-b-2 border-primary-500 pb-2"
            >
              <span className="font-inter text-2xl font-semibold text-primary-500">
                Ver todas las preguntas frecuentes
              </span>
              <ArrowRight className="h-6 w-6 text-primary-500 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}