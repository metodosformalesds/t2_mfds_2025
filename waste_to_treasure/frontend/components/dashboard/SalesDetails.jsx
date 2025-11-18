// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Componente que muestra el detalle de una venta específica del usuario, incluyendo 
//              productos vendidos, totales, comprador, dirección de envío y estado de la venta.

'use client';

import { DollarSign, Package, User, CreditCard, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: SalesDetails
 * Descripción: vista detallada de una venta del usuario mostrando información del comprador, dirección de envío, items vendidos y total de la venta
 */

export default function SalesDetails({ sale }) {
  const { user } = useAuth();
  
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
    };
    return labels[status?.toLowerCase()] || status;
  };

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

  const totalAmount = typeof sale.total_amount === 'number' 
    ? sale.total_amount 
    : parseFloat(sale.total_amount || 0);

  // Filtrar solo los items que pertenecen al vendedor actual
  const myItems = sale.order_items?.filter(item => 
    item.listing && item.listing.seller_id === user?.user_id
  ) || [];

  // Calcular el total solo de los items del vendedor
  const myTotal = myItems.reduce((sum, item) => {
    const price = typeof item.price_at_purchase === 'number' 
      ? item.price_at_purchase 
      : parseFloat(item.price_at_purchase || 0);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Botón de regreso */}
      <Link 
        href="/dashboard/sales"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-inter font-semibold"
      >
        ← Volver a Mis Ventas
      </Link>

      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-neutral-900">
              Venta #{sale.order_id}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600 font-inter">
                {formatDate(sale.created_at)}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(sale.status)} font-inter`}>
            {getStatusLabel(sale.status)}
          </span>
        </div>
      </div>

      {/* Información del Comprador */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Información del Comprador
        </h2>
        <div className="space-y-2">
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Nombre:</span> {sale.buyer?.full_name || 'No disponible'}
          </p>
          <p className="font-inter text-gray-700">
            <span className="font-semibold">Email:</span> {sale.buyer?.email || 'No disponible'}
          </p>
        </div>
      </div>

      {/* Productos Vendidos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Productos Vendidos
        </h2>
        <div className="space-y-4">
          {myItems.length > 0 ? (
            myItems.map((item, index) => (
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
                      Cantidad vendida: {item.quantity}
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
            <p className="text-gray-500 font-inter text-center py-8">No tienes productos vendidos en esta orden</p>
          )}
        </div>
      </div>

      {/* Dirección de Envío */}
      {sale.shipping_address && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Dirección de Envío
          </h2>
          <div className="space-y-2">
            <p className="font-inter text-gray-700">
              <span className="font-semibold">Calle:</span> {sale.shipping_address.street}
            </p>
            {sale.shipping_address.city && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Ciudad:</span> {sale.shipping_address.city}
              </p>
            )}
            {sale.shipping_address.state && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Estado:</span> {sale.shipping_address.state}
              </p>
            )}
            {sale.shipping_address.postal_code && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">Código Postal:</span> {sale.shipping_address.postal_code}
              </p>
            )}
            {sale.shipping_address.country && (
              <p className="font-inter text-gray-700">
                <span className="font-semibold">País:</span> {sale.shipping_address.country}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen de la Venta */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold font-poppins text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Resumen de la Venta
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between font-inter text-gray-700">
            <span>Total de tus productos:</span>
            <span>${myTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-inter text-gray-500 text-sm">
            <span>Total de la orden completa:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-inter text-gray-700 border-t pt-3">
            <span className="font-semibold text-lg">Recibirás:</span>
            <span className="font-semibold text-lg text-green-600">${myTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1 font-inter">
          ℹ️ Información adicional
        </h3>
        <p className="text-sm text-blue-700 font-inter">
          Asegúrate de preparar y enviar el pedido lo antes posible. El comprador recibirá notificaciones sobre el estado del envío.
        </p>
      </div>
    </div>
  );
}
