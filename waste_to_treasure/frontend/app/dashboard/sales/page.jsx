import SalesList from '@/components/dashboard/SalesList';

export const metadata = {
  title: 'Mis Ventas - Waste to Treasure',
  description: 'Gestiona y visualiza tus ventas realizadas.',
};

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <SalesList />
    </div>
  );
}