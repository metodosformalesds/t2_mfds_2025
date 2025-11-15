'use client';

import { useSales } from '@/hooks/useSales';
import { DollarSign, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SalesList() {
  const { sales, isLoading, error, pagination, goToPage, nextPage, prevPage } = useSales();
  const { user } = useAuth();

  const handleViewDetails = (orderId) => {
    window.location.href = `/dashboard/sales/${orderId}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completada':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'processing':
      case 'pendiente':
      case 'en proceso':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'shipped':
      case 'enviado':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'cancelled':
      case 'cancelada':
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
      month: 'short',
      day: 'numeric'
    });
  };

  // Mostrar loader mientras carga
  if (isLoading && sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-inter">{error}</span>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Venta ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Comprador
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Productos
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Total
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Fecha
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
              sales.map((order) => {
                // Contar solo los productos del vendedor actual
                const myItemsCount = order.order_items?.filter(item => 
                  item.listing && item.listing.seller_id === user?.user_id
                ).length || 0;

                // Calcular el total solo de los items del vendedor
                const myTotal = order.order_items?.reduce((sum, item) => {
                  if (item.listing && item.listing.seller_id === user?.user_id) {
                    const price = typeof item.price_at_purchase === 'number' 
                      ? item.price_at_purchase 
                      : parseFloat(item.price_at_purchase || 0);
                    return sum + (price * item.quantity);
                  }
                  return sum;
                }, 0) || 0;

                return (
                  <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                      #{order.order_id}
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-inter">
                      {order.buyer?.full_name || order.buyer?.email || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-inter">
                      {myItemsCount} producto(s)
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                      ${myTotal.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-inter text-sm">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)} font-inter`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleViewDetails(order.order_id)}
                        className="px-6 py-2 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full hover:bg-primary-200 transition-colors border border-primary-300 font-inter"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center">
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

      {/* Paginación */}
      {sales.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600 font-inter">
            Mostrando{' '}
            <span className="font-semibold">{((pagination.page - 1) * pagination.pageSize) + 1}</span>
            {' '}-{' '}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}de{' '}
            <span className="font-semibold">{pagination.total}</span>
            {' '}ventas
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg font-inter text-sm font-semibold transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={nextPage}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}