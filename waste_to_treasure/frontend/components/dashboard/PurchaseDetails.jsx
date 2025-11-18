// Autor: Gabriel Florentino Reyes
// Fecha: 12/11/2025
// Descripción: Componente que muestra los detalles completos de un pedido, 
//              incluyendo productos, cantidades, precios, dirección de envío, estado del pedido y 
//              resumen de pago.

'use client';

import { ShoppingBag, Package, MapPin, CreditCard, Calendar, User } from 'lucide-react';
import Link from 'next/link';

/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: PurchaseDetails
 * Descripción: vista detallada de una compra mostrando información de envío, detalles de items, cantidad y precio unitario, total y estado de la orden
 */

export default function PurchaseDetails({ order }) {
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


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalAmount = typeof order.total_amount === 'number' 
    ? order.total_amount 
    : parseFloat(order.total_amount || 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-neutral-900">
            Pedido #{order.order_id}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600 font-inter">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Productos
        </h2>
        <div className="space-y-4">
          {order.order_items && order.order_items.length > 0 ? (
            order.order_items.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.listing?.primary_image_url ? (
                      <img 
                        src={item.listing.primary_image_url} 
                        alt={item.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 font-inter">
                      {item.listing?.title || 'Producto no disponible'}
                    </p>
                    <p className="text-sm text-gray-600 font-inter">
                      Cantidad: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600 font-inter">
                      Precio unitario: ${typeof item.price_at_purchase === 'number' ? item.price_at_purchase.toFixed(2) : parseFloat(item.price_at_purchase || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 font-inter">
                    ${(typeof item.price_at_purchase === 'number' ? item.price_at_purchase * item.quantity : parseFloat(item.price_at_purchase || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 font-inter text-center py-8">No hay productos en este pedido</p>
          )}
        </div>
      </div>

      {/* Información de Envío */}
      {order.shipping_address && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Dirección de Envío
          </h2>
          <div className="space-y-2">
            <p className="font-inter text-gray-700">
              <span className="font-semibold">Calle:</span> {order.shipping_address.street}
            </p>
            {order.shipping_address.city && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Ciudad:</span> {order.shipping_address.city}
              </p>
            )}
            {order.shipping_address.state && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Estado:</span> {order.shipping_address.state}
              </p>
            )}
            {order.shipping_address.postal_code && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Código Postal:</span> {order.shipping_address.postal_code}
              </p>
            )}
            {order.shipping_address.country && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">País:</span> {order.shipping_address.country}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen del Pedido */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Resumen del Pedido
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between font-inter text-gray-700">
            <span>Subtotal:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-inter text-gray-700 border-t pt-3">
            <span className="font-semibold text-lg">Total:</span>
            <span className="font-semibold text-lg text-primary-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1 font-inter">
          ℹ️ Información adicional
        </h3>
        <p className="text-sm text-blue-700 font-inter">
          Si tienes alguna pregunta sobre tu pedido, puedes contactar al vendedor o a nuestro equipo de soporte.
        </p>
      </div>
    </div>
  );
}
