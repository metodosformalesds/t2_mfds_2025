'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SalesList() {
  const router = useRouter();

  const [sales] = useState([
    { 
      id: '#10024', 
      product: 'Lote de Retazos de Tela', 
      buyer: 'María González',
      price: 129.99,
      status: 'Entregado'
    },
    { 
      id: '#10025', 
      product: 'Madera Reciclada de Pino', 
      buyer: 'Carlos Ramírez',
      price: 208.99,
      status: 'Entregado'
    },
    { 
      id: '#10026', 
      product: 'Silla de tarima Reciclada', 
      buyer: 'Ana Martínez',
      price: 165.90,
      status: 'Entregado'
    },
    { 
      id: '#10027', 
      product: 'Retazos de Mezclilla', 
      buyer: 'Luis Hernández',
      price: 89.50,
      status: 'Entregado'
    },
  ]);

  const handleViewDetails = (sale) => {
    router.push(`/dashboard/sales/${sale.id.replace('#','')}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-4 md:flex-row md:items-center">
        <h1 className="font-poppins text-3xl font-bold text-neutral-900">
          Mis ventas
        </h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Producto ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Producto
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Comprador
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Precio
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Estado
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((sale, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    {sale.id}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {sale.product}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {sale.buyer}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    ${sale.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {sale.status}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleViewDetails(sale)}
                      className="rounded-lg border border-[#3547B5] bg-[#3547B5]/20 px-4 py-1.5 font-inter text-sm font-semibold text-[#3547B5] transition-colors hover:bg-[#3547B5]/30"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <DollarSign className="w-12 h-12" />
                    <p className="font-inter font-semibold">
                      No tienes ventas registradas
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
