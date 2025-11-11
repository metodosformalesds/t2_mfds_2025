import PurchasesList from '@/components/dashboard/PurchasesList';

export const metadata = {
  title: 'Mis Compras - Waste to Treasure',
  description: 'Historial de compras y pedidos realizados.',
};

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PurchasesList />
    </div>
  );
}