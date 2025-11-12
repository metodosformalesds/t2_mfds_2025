'use client';

import { useSearchParams } from 'next/navigation';
import SalesDetails from '@/components/dashboard/SalesDetails';

export default function SaleDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // TODO: Reemplazar con fetch real desde API usando `id`
  const sale = {
    id: `#${id}`,
    product: 'Lote de Retazos de Tela',
    buyer: 'María González',
    price: 129.99,
    quantity: 2,
    status: 'Entregado',
    date: '2025-11-08'
  };

  return <SalesDetails sale={sale} />;
}
