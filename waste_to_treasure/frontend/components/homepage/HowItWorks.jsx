/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: HowItWorks
 * Descripción: sección explicativa del proceso de economía circular en 3 pasos (empresa publica, artesano transforma, consumidor disfruta) con tarjetas numeradas y colores distintivos
 */

const steps = [
  {
    number: 1,
    title: 'La Empresa Publica',
    description:
      'Una industria registra sus excedentes, residuos o materiales en desuso en el marketplace materiales.',
    color: 'bg-primary-500/10 text-primary-500',
  },
  {
    number: 2,
    title: 'El Artesano Transforma',
    description:
      'Un artesano o taller local descubre y adquiere estos materiales a bajo costo para sus proyectos.',
    color: 'bg-secondary-600/10 text-secondary-600',
  },
  {
    number: 3,
    title: 'El Consumidor Disfruta',
    description:
      'El producto terminado y sostenible se publica en el marketplace productos, listo para ser comprado por ti.',
    color: 'bg-neutral-900/10 text-neutral-900',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
            Así conectamos el ciclo
          </h2>
          <p className="mt-4 text-base text-neutral-600">
            Nuestra plataforma facilita la transición de residuos a tesoros en
            tres simples pasos
          </p>
        </div>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map(step => (
            <div key={step.number} className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full font-poppins text-2xl font-semibold ${step.color}`}
              >
                {step.number}
              </div>
              <h3 className="mt-6 font-roboto text-xl font-bold text-neutral-900">
                {step.title}
              </h3>
              <p className="mt-2 text-base text-neutral-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}