/**
 * Tarjeta de estadística para el Dashboard de Admin.
 * Muestra un título y un valor grande.
 */
export default function StatCard({ title, value }) {
  return (
    <div className="flex h-[220px] flex-col justify-center gap-10 rounded-xl bg-white p-6 shadow-md">
      <h3 className="font-roboto text-2xl font-bold text-neutral-900/70">
        {title}
      </h3>
      <p className="truncate font-roboto text-4xl font-bold text-primary-500">
        {value}
      </p>
    </div>
  )
}