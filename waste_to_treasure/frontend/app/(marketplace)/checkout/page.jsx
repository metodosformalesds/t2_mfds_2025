'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAdminGuard' 
import { addressService } from '@/lib/api/address'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import AddAddressForm from '@/components/checkout/AddAddressForm'
import { Home, Briefcase, Plus } from 'lucide-react'

// ... (Datos mock de envío y componentes de tarjeta no cambian) ...
const mockShippingMethods = [
  {
    method_id: 1,
    name: 'Envío estándar',
    description: '5-7 días hábiles',
    cost: 150.0,
    type: 'delivery',
  },
  {
    method_id: 2,
    name: 'Recolección directa',
    description: 'Disponible en 2 días hábiles',
    cost: 0.0,
    type: 'pickup',
  },
]

function AddressCard({ address, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-lg border-2 bg-neutral-50 p-6 text-left shadow-md transition-all
        ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-neutral-200 hover:border-neutral-400'}
      `}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        {address.notes?.includes('Oficina') ? (
          <Briefcase size={24} />
        ) : (
          <Home size={24} />
        )}
      </div>
      <div>
        <h4 className="font-roboto text-xl font-bold text-black">
          {address.notes?.split('.')[0] || 'Mi Dirección'}
        </h4>
        <p className="font-inter text-base font-medium text-neutral-600">
          {address.street}
        </p>
        <p className="font-inter text-base font-medium text-neutral-600">
          {address.city}, {address.state}, {address.postal_code}
        </p>
      </div>
      <div className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-neutral-400">
        {isSelected && <div className="h-3 w-3 rounded-full bg-primary-500" />}
      </div>
    </button>
  )
}

function ShippingCard({ method, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-1 items-center gap-4 rounded-lg border-2 bg-neutral-50 p-6 text-left shadow-md transition-all
        ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-neutral-200 hover:border-neutral-400'}
      `}
    >
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-neutral-400">
        {isSelected && <div className="h-3 w-3 rounded-full bg-primary-500" />}
      </div>
      <div>
        <h4 className="font-roboto text-xl font-bold text-black">
          {method.name}
        </h4>
        <p className="font-inter text-base font-medium text-neutral-600">
          {method.description}
        </p>
        <p className="font-inter text-base font-medium text-neutral-600">
          {method.cost > 0 ? `Costo adicional: $${method.cost.toFixed(2)}` : 'Sin costo adicional'}
        </p>
      </div>
    </button>
  )
}


export default function CheckoutPage() {
  const { isAuthorized, isLoading: isAuthLoading } = useAuthGuard()
  const router = useRouter()
  // --- INICIO DE MODIFICACIÓN ---
  // Cargar estado desde el store
  const { setAddress, setShippingMethod, addressId, shippingMethod } = useCheckoutStore()
  // --- FIN DE MODIFICACIÓN ---
  
  const [step, setStep] = useState('delivery')
  const [addresses, setAddresses] = useState([])
  const [shippingMethods, setShippingMethods] = useState(mockShippingMethods)
  
  // --- INICIO DE MODIFICACIÓN ---
  // El estado local se sincroniza con el store
  const [selectedAddressId, setSelectedAddressId] = useState(addressId)
  const [selectedShippingId, setSelectedShippingId] = useState(shippingMethod?.method_id || shippingMethods[0]?.method_id)
  // --- FIN DE MODIFICACIÓN ---
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFormVisible, setIsAddFormVisible] = useState(false)

  useEffect(() => {
    if (!isAuthorized) return 

    const loadData = async () => {
      try {
        setIsLoading(true)
        const addressData = await addressService.getMyAddresses()
        
        setAddresses(addressData.items || [])
        // Si hay un ID en el store, usarlo. Si no, usar el default/primero
        if (addressId) {
          setSelectedAddressId(addressId)
        } else {
          const defaultAddress = addressData.items.find(a => a.is_default) || addressData.items[0]
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.address_id)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos de checkout:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [isAuthorized, addressId]) // <-- Añadido addressId

  const handleAddressAdded = (newAddress) => {
    setAddresses(prev => [...prev, newAddress])
    setSelectedAddressId(newAddress.address_id)
    setIsAddFormVisible(false)
  }

  const handleContinue = () => {
    // Guardar selecciones en el store de Zustand
    setAddress(selectedAddressId)
    const selectedMethod = shippingMethods.find(m => m.method_id === selectedShippingId)
    setShippingMethod(selectedMethod)
    
    router.push('/checkout/payment')
  }
  
  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mx-auto max-w-5xl">
          <CheckoutStepper currentStep={step} />
        </div>

        <div className="mt-10">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Información de entrega
          </h1>
          <p className="font-inter text-lg font-medium text-neutral-700">
            Selecciona tu método de entrega preferido
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
          
          <div className="w-full flex-1 space-y-8">
            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
                Dirección de envío
              </h2>
              <div className="mt-6 space-y-4">
                {isLoading && addresses.length === 0 ? (
                  <p>Cargando direcciones...</p>
                ) : (
                  addresses.map(addr => (
                    <AddressCard
                      key={addr.address_id}
                      address={addr}
                      isSelected={selectedAddressId === addr.address_id}
                      onSelect={() => setSelectedAddressId(addr.address_id)}
                    />
                  ))
                )}
                
                {!isAddFormVisible && (
                  <button
                    onClick={() => setIsAddFormVisible(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-400 p-6 text-neutral-600 transition hover:border-primary-500 hover:text-primary-500"
                  >
                    <Plus size={20} />
                    <span className="font-roboto text-xl font-bold">
                      Agregar nueva dirección
                    </span>
                  </button>
                )}
                
                {isAddFormVisible && (
                  <AddAddressForm
                    onAddressAdded={handleAddressAdded}
                    onCancel={() => setIsAddFormVisible(false)}
                  />
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
                Método de envío
              </h2>
              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                {shippingMethods.map(method => (
                  <ShippingCard
                    key={method.method_id}
                    method={method}
                    isSelected={selectedShippingId === method.method_id}
                    onSelect={() => setSelectedShippingId(method.method_id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96">
            <CheckoutSummary
              onContinue={handleContinue}
              buttonText="Continuar"
              backLink="/cart"
              backText="← Volver al carrito"
            />
          </div>
        </div>
      </div>
    </div>
  )
}