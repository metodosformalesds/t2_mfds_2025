/**
 * Muestra la tabla de categorías existentes en el admin.
 */
export default function CategoryList({ categories, onEdit, onDelete }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-8 font-poppins text-3xl font-semibold text-neutral-900">
          Categorías existentes
        </h2>
        <p className="text-neutral-600 font-inter">No hay categorías disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-md">
      {/* Contenedor de la tabla para overflow en móvil */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full table-auto">
          {/* Encabezado de la tabla */}
          <thead className="border-b-2 border-neutral-100 bg-neutral-100">
            <tr>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Nombre
              </th>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Tipo
              </th>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Acciones
              </th>
            </tr>
          </thead>
          
          {/* Cuerpo de la tabla */}
          <tbody className="divide-y divide-neutral-200">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-inter text-base text-neutral-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 font-inter text-base text-neutral-900">
                  {category.type}
                </td>
                <td className="flex gap-2 px-6 py-4">
                  <button
                    onClick={() => onEdit(category)}
                    className="rounded-lg bg-primary-500 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="rounded-lg bg-secondary-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-500"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}