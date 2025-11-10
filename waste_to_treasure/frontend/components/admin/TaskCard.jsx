import Link from 'next/link'

/**
 * Tarjeta de tareas pendientes para el Dashboard de Admin.
 * Muestra un título, un contador grande y un enlace de acción.
 */
export default function TaskCard({ title, value, linkText, linkHref }) {
  return (
    <div className="flex h-[242px] flex-col justify-center gap-10 rounded-xl bg-white p-6 shadow-md">
      <h3 className="font-roboto text-2xl font-bold text-neutral-900/70 mt-5">
        {title}
      </h3>
      <p className="font-roboto text-5xl font-bold text-primary-500">
        {value}
      </p>
      <Link
        href={linkHref}
        className="font-inter font-medium text-secondary-600 transition-colors hover:text-secondary-500 hover:underline"
      >
        {linkText} →
      </Link>
    </div>
  )
}