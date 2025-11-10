import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import TaskCard from '@/components/admin/TaskCard'

// (Datos de kpiData sin cambios...)
const kpiData = [
  { title: 'Nuevos usuarios (24h)', value: '12' },
  { title: 'Transacciones (24h)', value: '45' },
  { title: 'Ingresos por comisión (mes)', value: '$1,205.50' },
  { title: 'Publicaciones totales', value: '832' },
]

// --- INICIO DE LA CORRECCIÓN DE LINKS ---
const taskData = [
  {
    title: 'Publicaciones por moderar',
    value: '8',
    linkText: 'Revisar publicaciones',
    linkHref: '/admin/moderation', // Corregido
  },
  {
    title: 'Reportes de usuario pendientes',
    value: '3',
    linkText: 'Revisar reportes de usuario',
    linkHref: '/admin/reports', // Corregido
  },
  {
    title: 'Reportes de listados pendientes',
    value: '1', // Corregido (antes '1Z')
    linkText: 'Revisar reporte de listados',
    linkHref: '/admin/reports', // Corregido
  },
]
// --- FIN DE LA CORRECCIÓN ---

export default function AdminDashboardPage() {
  return (
    // El padding p-12 ahora está en el layout
    <>
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Dashboard
      </h1>

      <section className="mt-12">
        <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
          KPI’s del sistema
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map(item => (
            <StatCard key={item.title} title={item.title} value={item.value} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
          Colas de tarea
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {taskData.map(item => (
            <TaskCard
              key={item.title}
              title={item.title}
              value={item.value}
              linkText={item.linkText}
              linkHref={item.linkHref}
            />
          ))}
        </div>
      </section>
    </>
  )
}