'use client';

import PurchaseDetails from '@/components/dashboard/PurchaseDetails';
import { useSearchParams } from 'next/navigation';

export default function PurchaseDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // TODO: Reemplazar con fetch real desde API
  const order = {
    id: `#${id}`,
    product: 'Silla de tarima Reciclada',
    seller: 'Ensambles Textiles S.A',
    price: 129.99,
    status: 'Entregado',
    date: '2025-11-08'
  };

  return (
      <PurchaseDetails order={order} />
  );
}
