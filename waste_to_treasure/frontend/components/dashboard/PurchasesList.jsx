'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PurchasesList() {
  const router = useRouter();

  const [orders] = useState([
    { 
      id: '#10023', 
      product: 'Silla de tarima Reciclada', 
      seller: 'Ensambles Textiles S.A',
      price: 129.99,
      status: 'Entregado'
    },
    { 
      id: '#10024', 
      product: 'Lote de retazos de madera', 
      seller: 'Ensambles Textiles S.A',
      price: 208.99,
      status: 'Entregado'
    },
    { 
      id: '#10025', 
      product: 'Retazos de Mezclilla', 
      seller: 'Ensambles Textiles S.A',
      price: 165.90,
      status: 'Entregado'
    },
    { 
      id: '#10026', 
      product: 'Silla de tarima Reciclada', 
      seller: 'Ensambles Textiles S.A',
      price: 79.88,
      status: 'Entregado'
    },
  ]);

  const handleViewDetails = (order) => {
    router.push(`/dashboard/purchases/${order.id.replace('#','')}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-4 md:flex-row md:items-center">
        <h1 className="font-poppins text-3xl font-bold text-neutral-900">
          Mis compras
        </h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Pedido ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Productos
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Vendedor
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
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    {order.id}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {order.product}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {order.seller}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    ${order.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {order.status}
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => handleViewDetails(order)} 
                      className="rounded-lg border border-[#3547B5] bg-[#3547B5]/20 px-4 py-1.5 font-inter text-sm font-semibold text-[#3547B5] transition-colors hover:bg-[#3547B5]/30">
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <ShoppingBag className="w-12 h-12" />
                    <p className="font-inter font-semibold">
                      No tienes compras registradas
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
