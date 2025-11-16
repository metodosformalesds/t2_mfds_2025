'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VerticalStepper from '@/components/dashboard/VerticalStepper'
import Step1_Type from '@/components/dashboard/Step1_Type'
import Step2_Info from '@/components/dashboard/Step2_Info'
import Step3_Media from '@/components/dashboard/Step3_Media'
import Step4_Review from '@/components/dashboard/Step4_Review'
import listingsService from '@/lib/api/listings'
// --- INICIO DE CORRECCIÓN ---
// Importamos el modal de éxito que ya habíamos creado
import SuccessModal from '@/components/dashboard/SuccessModal'
// --- FIN DE CORRECCIÓN ---

const INITIAL_DATA = {
  type: null,
  category: '',
  title: '',
  description: '',
  price: '',
  quantity: 1,
  condition: '',
  location: '', // Campo para la ubicación
  images: [],
}

export default function PublishItemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [listingData, setListingData] = useState(INITIAL_DATA)
  // --- INICIO DE CORRECCIÓN ---
  // Este estado controlará la visibilidad del modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  // --- FIN DE CORRECCIÓN ---

  const handleNext = () => {
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  // --- INICIO DE CORRECCIÓN ---
  // Esta función crea el listing SIN imágenes primero, retorna el listing creado
  const handlePublish = async (imageUrls = []) => {
    try {
      console.log('[handlePublish] Publicando en la API...', listingData)
      console.log('[handlePublish] URLs de imágenes a incluir:', imageUrls)

      // Preparar datos para el backend
      const payload = {
        listing_type: listingData.type,
        title: listingData.title,
        description: listingData.description,
        price: parseFloat(listingData.price),
        price_unit: listingData.unit || 'unidad',
        quantity: parseInt(listingData.quantity),
        category_id: parseInt(listingData.category_id),
        origin_description: listingData.origin_description || null,
        location_address_id: listingData.location_address_id || null,
        images: imageUrls
      }

      console.log('[handlePublish] Payload a enviar:', payload)

      // Llamar a la API para crear el listing
      const createdListing = await listingsService.create(payload)

      console.log('[handlePublish] Listing creado exitosamente:', createdListing)
      
      // NO mostrar modal de éxito aquí - Step4 lo hará después de subir imágenes
      // setShowSuccessModal(true)
      
      // Retornar el listing creado para que Step4 pueda usar el ID
      return createdListing

    } catch (error) {
      console.error('[handlePublish] Error al publicar listing:', error)
      console.error('[handlePublish] Error completo:', JSON.stringify(error.response?.data, null, 2))
      
      // Construir mensaje de error detallado
      let errorMessage = 'Error desconocido'
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Errores de validación de Pydantic
        const validationErrors = error.response.data.errors.map(err => {
          const field = err.loc[err.loc.length - 1] // Último elemento es el campo
          return `${field}: ${err.msg}`
        }).join('\n')
        
        errorMessage = `Errores de validación:\n${validationErrors}`
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(`Error al publicar:\n\n${errorMessage}`)
      throw error // Re-lanzar para que Step4 lo maneje
    }
  }

  // Esta función se llama desde el Modal 2 (de éxito)
  const handlePublishAnother = () => {
    setListingData(INITIAL_DATA) // Resetea el formulario
    setStep(1) // Vuelve al paso 1
    setShowSuccessModal(false) // Cierra el modal de éxito
  }
  // --- FIN DE CORRECCIÓN ---

  const updateListingData = newData => {
    setListingData(prev => ({
      ...prev,
      ...newData,
    }))
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1_Type
            onNext={handleNext}
            listingData={listingData}
            updateListingData={updateListingData}
          />
        )
      case 2:
        return (
          <Step2_Info
            onNext={handleNext}
            onBack={handleBack}
            listingData={listingData}
            updateListingData={updateListingData}
          />
        )
      case 3:
        return (
          <Step3_Media
            onNext={handleNext}
            onBack={handleBack}
            listingData={listingData}
            updateListingData={updateListingData}
          />
        )
      case 4:
        return (
          <Step4_Review
            onPublish={handlePublish} // Se pasa la función al Paso 4
            onBack={handleBack}
            listingData={listingData}
            setStep={setStep}
            updateListingData={updateListingData}
            onSuccess={() => setShowSuccessModal(true)} // ✅ Mostrar modal después de todo
          />
        )
      default:
        return (
          <Step1_Type
            onNext={handleNext}
            listingData={listingData}
            updateListingData={updateListingData}
          />
        )
    }
  }

  return (
    <>
      {/* --- INICIO DE CORRECCIÓN ---
        Ocultamos el asistente si el modal de éxito está activo
      --- FIN DE CORRECCIÓN --- */}
      {!showSuccessModal && (
        <div className="flex flex-col gap-6">
          <h1 className="text-black text-3xl font-poppins font-semibold">
            Publicar un nuevo ítem
          </h1>
          {/* Stepper responsivo para móvil */}
          <div className="lg:hidden">
            <p className="text-center text-lg font-semibold text-primary-500">
              Paso {step} de 4:{' '}
              {['Tipo', 'Información', 'Multimedia', 'Revisión'][step - 1]}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-primary-500 h-2.5 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          {/* Contenido principal del asistente */}
          <div className="flex flex-col lg:flex-row gap-6">
            <VerticalStepper currentStep={step} />
            <div className="flex-1 min-w-0">{renderStep()}</div>
          </div>
        </div>
      )}

      {/* --- INICIO DE CORRECCIÓN ---
        Renderizamos el modal de éxito aquí, controlado por el estado
      --- FIN DE CORRECCIÓN --- */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onPublishAnother={handlePublishAnother}
      />
    </>
  )
}