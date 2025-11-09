import PlansHeader from '@/components/plans/PlansHeader'
import ComparisonTable from '@/components/plans/ComparisonTable'
import Faq from '@/components/plans/Faq'

export const metadata = {
  title: 'Planes y Precios - Waste to Treasure',
  description:
    'Elige el plan que mejor se adapte a tus necesidades y comienza a formar parte de la economía circular.',
}

export default function PlansPage() {
  return (
    <div className="overflow-hidden bg-neutral-100">
      {/* PlansHeader es un Client Component que maneja el estado del toggle (Mensual/Anual)
        y renderiza tanto el hero verde como las tarjetas de precios.
      */}
      <PlansHeader />

      {/* La tabla de comparación y las FAQs son componentes estáticos (Server Components).
      */}
      <ComparisonTable />
      <Faq />
    </div>
  )
}