'use client';

import { DollarSign } from 'lucide-react';

export default function SalesDetails({ sale }) {
  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DollarSign className="w-16 h-16 text-gray-400" />
        <p className="mt-4 text-gray-500 font-inter text-lg font-semibold">
          No se encontró información de la venta
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
      {/* Encabezado */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-poppins text-neutral-900">
          Detalles de la Venta {sale.id}
        </h1>
        <p className="text-sm text-gray-600 font-inter mt-1">
          Fecha de venta: {sale.date} | Estado: {sale.status}
        </p>
      </div>

      {/* Información del producto */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-poppins text-gray-900">
          Producto
        </h2>
        <div className="flex flex-col gap-2">
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Nombre:</span> {sale.product}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Comprador:</span> {sale.buyer}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Cantidad:</span> {sale.quantity}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Precio unitario:</span> ${sale.price}
          </p>
          <p className="font-inter text-gray-700 font-semibold">
            Precio total: ${(sale.price * sale.quantity).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1 font-inter">
          Información adicional
        </h3>
        <p className="text-sm text-blue-700 font-inter">
          Esta venta se procesará según la política de la tienda. Puedes
          revisar el estado del envío o solicitar soporte en caso de dudas.
        </p>
      </div>
    </div>
  );
}
