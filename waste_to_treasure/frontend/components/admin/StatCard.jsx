/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: StatCard
 * Descripción: tarjeta de estadística que muestra un título descriptivo y un valor numérico grande para el dashboard
 */

export default function StatCard({ title, value }) {
  return (
    <div className="flex h-[180px] flex-col justify-between rounded-xl bg-white p-6 shadow-md">
      <h3 className="font-roboto text-lg font-semibold text-neutral-900/70 leading-tight">
        {title}
      </h3>
      <p className="font-roboto text-4xl font-bold text-primary-500 truncate">
        {value}
      </p>
    </div>
  )
}