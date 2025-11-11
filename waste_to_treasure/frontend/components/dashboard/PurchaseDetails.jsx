'use client';

import { ShoppingBag } from 'lucide-react';

export default function PurchaseDetails({ order }) {
  // order es un objeto que contiene todos los datos del pedido
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShoppingBag className="w-16 h-16 text-gray-400" />
        <p className="mt-4 text-gray-500 font-inter text-lg font-semibold">
          No se encontró información del pedido
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 space-y-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-poppins text-neutral-900">
          Detalles del Pedido {order.id}
        </h1>
        <p className="text-sm text-gray-600 font-inter mt-1">
          Fecha de compra: {order.date} | Estado: {order.status}
        </p>
      </div>

      {/* Información del producto */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-poppins text-gray-900">
          Producto
        </h2>
        <div className="flex flex-col gap-2">
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Nombre:</span> {order.product}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Vendedor:</span> {order.seller}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Precio:</span> ${order.price}
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1 font-inter">
          Información adicional
        </h3>
        <p className="text-sm text-blue-700 font-inter">
          Este pedido se procesará según la política de la tienda. Puedes
          revisar el estado de tu envío o solicitar soporte en caso de dudas.
        </p>
      </div>
    </div>
  );
}
