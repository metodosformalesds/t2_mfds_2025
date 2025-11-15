'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PurchaseDetails from '@/components/dashboard/PurchaseDetails';
import { ordersService } from '@/lib/api/orders';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PurchaseDetailPage() {
  const params = useParams();
  const orderId = params.id;
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setIsLoading(true);
        const data = await ordersService.getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Error al cargar los detalles de la compra');
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <p className="text-red-600 font-semibold">Error al cargar la compra</p>
            <p className="text-gray-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return <PurchaseDetails order={order} />;
}
