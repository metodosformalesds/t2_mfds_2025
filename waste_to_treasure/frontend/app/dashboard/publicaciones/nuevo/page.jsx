'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VerticalStepper from '@/components/dashboard/VerticalStepper'
import Step1_Type from '@/components/dashboard/Step1_Type'
import Step2_Info from '@/components/dashboard/Step2_Info'
import Step3_Media from '@/components/dashboard/Step3_Media'
import Step4_Review from '@/components/dashboard/Step4_Review'
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
  // Esta función se llama DESPUÉS de confirmar el Modal 1 (de confirmación)
  const handlePublish = () => {
    console.log('Publicando en la API...', listingData)
    // TODO: Aquí se haría la llamada real a la API para guardar los datos.
    // Simulamos que la API respondió con éxito:
    setShowSuccessModal(true) // <-- ¡AQUÍ SE MUESTRA EL MODAL DE ÉXITO!
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