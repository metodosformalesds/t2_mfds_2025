'use client'

import { useState } from 'react'
import Link from 'next/link'

// --- DATOS DE PRUEBA ---
// TODO: Reemplazar esto con una llamada a la API
const mockPublications = {
  active: [
    {
      id: 1,
      title: 'Silla de tarima Reciclada',
      price: '$129.99',
      type: 'Producto',
      stock: '8',
    },
    {
      id: 2,
      title: 'Lote de retazos de madera',
      price: '$208.99',
      type: 'Material',
      stock: '500kg',
    },
    {
      id: 3,
      title: 'Silla de tarima Reciclada',
      price: '$165.90',
      type: 'Producto',
      stock: '10',
    },
    {
      id: 4,
      title: 'Silla de tarima Reciclada',
      price: '$79.88',
      type: 'Producto',
      stock: '11',
    },
  ],
  pending: [
    {
      id: 5,
      title: 'Lote de llantas',
      price: '$50.00',
      type: 'Material',
      stock: '1',
    },
  ],
  inactive: [],
}
// --- FIN DE DATOS DE PRUEBA ---

// Componente para la Fila de la Tabla
function PublicationRow({ pub }) {
  return (
    <tr className="border-b border-neutral-200">
      <td className="py-4 px-2 font-inter text-sm text-[#596171]">
        {pub.title}
      </td>
      <td className="py-4 px-2 font-inter text-sm font-medium text-[#353A44]">
        {pub.price}
      </td>
      <td className="py-4 px-2 font-inter text-sm text-[#596171]">
        {pub.type}
      </td>
      <td className="py-4 px-2 font-inter text-sm text-[#596171]">
        {pub.stock}
      </td>
      <td className="py-4 px-2">
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/30">
            Editar
          </button>
          <button className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/30">
            Desactivar
          </button>
        </div>
      </td>
    </tr>
  )
}

// Componente para la Pestaña
function TabButton({ label, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 pb-2 font-inter text-base font-semibold transition-colors
        ${
          isActive
            ? 'border-primary-500 text-primary-500'
            : 'border-transparent text-neutral-900/60 hover:text-neutral-900'
        }
      `}
    >
      {label} ({count})
    </button>
  )
}

export default function PublicationsList() {
  const [activeTab, setActiveTab] = useState('active')

  // TODO: Conectar esto a la API
  const publications = mockPublications[activeTab] || []

  return (
    <div className="w-full rounded-xl bg-white p-8 shadow-lg">
      {/* Cabecera */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-4 md:flex-row md:items-center">
        <h1 className="font-poppins text-3xl font-bold text-neutral-900">
          Mis Publicaciones
        </h1>
        <Link
          href="/dashboard/publicaciones/nuevo"
          className="w-full rounded-lg bg-primary-500 px-6 py-3 text-center font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600 md:w-auto"
        >
          Publicar Nuevo
        </Link>
      </div>

      {/* Pestañas de Filtro */}
      <div className="mt-6 flex items-center gap-6 border-b border-neutral-900/60">
        <TabButton
          label="Activas"
          count={mockPublications.active.length}
          isActive={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        />
        <TabButton
          label="Pendientes"
          count={mockPublications.pending.length}
          isActive={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        />
        <TabButton
          label="Inactivas"
          count={mockPublications.inactive.length}
          isActive={activeTab === 'inactive'}
          onClick={() => setActiveTab('inactive')}
        />
      </div>

      {/* Tabla de Publicaciones */}
      <div className="mt-6 w-full overflow-x-auto">
        <table className="w-full min-w-[700px] table-auto text-left">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="w-2/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                Publicaciones
              </th>
              <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                Precio
              </th>
              <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                Tipo
              </th>
              <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                Stock
              </th>
              <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {publications.length > 0 ? (
              publications.map(pub => (
                <PublicationRow key={pub.id} pub={pub} />
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-12 text-center font-inter text-neutral-600"
                >
                  No hay publicaciones en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}