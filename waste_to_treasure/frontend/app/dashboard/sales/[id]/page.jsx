// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Página que muestra los detalles de una venta específica. 
//              Obtiene la información mediante el ID de la venta usando el servicio ordersService. 
//              Mientras se cargan los datos muestra un loader, y en caso de error despliega un mensaje. 
//              Utiliza el componente SalesDetails para renderizar la información completa de la venta.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SalesDetails from '@/components/dashboard/SalesDetails';
import { ordersService } from '@/lib/api/orders';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SaleDetailPage() {
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
        setError(err.message || 'Error al cargar los detalles de la venta');
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
            <p className="text-red-600 font-semibold">Error al cargar la venta</p>
            <p className="text-gray-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return <SalesDetails sale={order} />;
}
