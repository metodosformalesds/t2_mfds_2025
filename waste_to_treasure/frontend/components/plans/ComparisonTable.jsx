import { Check, X } from 'lucide-react'

// Iconos para la tabla
const CheckIcon = () => <Check className="mx-auto h-6 w-6 text-primary-500" />
const CrossIcon = () => <X className="mx-auto h-6 w-6 text-neutral-400" />

const features = [
  {
    name: 'Publicaciones activas',
    basic: '5',
    pro: 'Ilimitadas',
    enterprise: 'Ilimitadas',
  },
  {
    name: 'Comisión por transacción',
    basic: '10%',
    pro: '8%',
    enterprise: '6%',
  },
  {
    name: 'Visibilidad destacada',
    basic: <CrossIcon />,
    pro: <CheckIcon />,
    enterprise: <CheckIcon />,
  },
  {
    name: 'Métricas de rendimiento',
    basic: <CrossIcon />,
    pro: 'Básicas',
    enterprise: 'Avanzadas',
  },
  {
    name: 'Reportes de impacto ambiental',
    basic: <CrossIcon />,
    pro: <CrossIcon />,
    enterprise: <CheckIcon />,
  },
  {
    name: 'Soporte',
    basic: 'Email',
    pro: 'Chat Prioritario',
    enterprise: 'Account Manager',
  },
]

export default function ComparisonTable() {
  return (
    <section className="bg-neutral-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-16 text-center font-poppins text-4xl font-bold text-neutral-900">
          Comparación Detallada de Planes
        </h2>

        <div className="w-full overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Cabecera de la Tabla */}
          <div className="grid grid-cols-10 items-center gap-4 bg-primary-500 px-8 py-6 text-left">
            <h3 className="col-span-4 font-inter text-xl font-bold text-white">
              Características
            </h3>
            <h3 className="col-span-2 text-center font-inter text-xl font-bold text-white">
              Básico
            </h3>
            <h3 className="col-span-2 text-center font-inter text-xl font-bold text-white">
              Pro
            </h3>
            <h3 className="col-span-2 text-center font-inter text-xl font-bold text-white">
              Empresarial
            </h3>
          </div>

          {/* Filas de Características */}
          <div className="divide-y divide-neutral-200">
            {features.map(feature => (
              <div
                key={feature.name}
                className="grid grid-cols-10 items-center gap-4 px-8 py-6"
              >
                <p className="col-span-4 font-inter text-lg font-semibold text-neutral-900">
                  {feature.name}
                </p>
                <div className="col-span-2 text-center font-inter text-lg font-medium text-neutral-700">
                  {feature.basic}
                </div>
                <div className="col-span-2 text-center font-inter text-lg font-medium text-neutral-700">
                  {feature.pro}
                </div>
                <div className="col-span-2 text-center font-inter text-lg font-medium text-neutral-700">
                  {feature.enterprise}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}