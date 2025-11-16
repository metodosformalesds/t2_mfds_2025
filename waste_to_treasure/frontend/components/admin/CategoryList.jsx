/**
 * Muestra la tabla de categorías existentes en el admin.
 */
export default function CategoryList({ categories, onEdit, onDelete }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md">
        <p className="text-neutral-600 font-inter text-center py-8">No hay categorías disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-md overflow-hidden">
      {/* Contenedor de la tabla para overflow en móvil */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full table-auto">
          {/* Encabezado de la tabla */}
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3.5 text-left font-inter text-sm font-semibold text-neutral-700">
                Categoría
              </th>
              <th className="px-6 py-3.5 text-left font-inter text-sm font-semibold text-neutral-700">
                Tipo
              </th>
              <th className="px-6 py-3.5 text-center font-inter text-sm font-semibold text-neutral-700">
                Productos
              </th>
              <th className="px-6 py-3.5 text-center font-inter text-sm font-semibold text-neutral-700">
                Hijos
              </th>
              <th className="px-6 py-3.5 text-right font-inter text-sm font-semibold text-neutral-700">
                Acciones
              </th>
            </tr>
          </thead>
          
          {/* Cuerpo de la tabla */}
          <tbody className="divide-y divide-neutral-100">
            {categories.map(category => {
              const isParent = !category.parent_category_id
              const hasChildren = (category.children_count || 0) > 0
              const hasProducts = (category.product_count || 0) > 0
              
              return (
                <tr key={category.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-inter text-base text-neutral-900 font-medium">
                        {category.name}
                      </span>
                      {isParent && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Padre
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      category.type === 'MATERIAL' 
                        ? 'bg-green-50 text-green-700 ring-green-600/20' 
                        : 'bg-purple-50 text-purple-700 ring-purple-600/20'
                    }`}>
                      {category.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${
                      hasProducts
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {category.product_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${
                      hasChildren
                        ? 'bg-secondary-100 text-secondary-700' 
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {category.children_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(category)}
                        className="rounded-lg bg-primary-500 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(category)}
                        className="rounded-lg bg-secondary-600 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}