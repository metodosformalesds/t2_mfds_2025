'use client'

// --- INICIO DE CORRECCIÓN FUNCIONAL ---
import { useState, useEffect } from 'react'
import uploadService from '@/lib/api/upload'
import listingsService from '@/lib/api/listings'
// --- FIN DE CORRECCIÓN FUNCIONAL ---
import { useConfirmStore } from '@/stores/useConfirmStore'
// --- INICIO DE CORRECCIÓN FUNCIONAL ---
import { Edit2, Camera, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
// --- FIN DE CORRECCIÓN FUNCIONAL ---

// --- INICIO DE CORRECCIÓN FUNCIONAL ---

// Helper para mostrar un valor o un placeholder
const DetailItem = ({ label, value, placeholder = 'No especificado' }) => (
  <div>
    <h5 className="text-sm font-semibold text-dark uppercase tracking-wide">
      {label}
    </h5>
    <p className="font-inter text-base text-neutral-900 break-words">
      {value || placeholder}
    </p>
  </div>
)

// Helper para formatear el tipo
const formatType = type => {
  if (type === 'PRODUCT') return 'Producto'
  if (type === 'MATERIAL') return 'Material'
  return 'No especificado'
}

// Helper para formatear la condición
const formatCondition = condition => {
  if (condition === 'NEW') return 'Nuevo (Sin usar)'
  if (condition === 'USED') return 'Usado (En buenas condiciones)'
  if (condition === 'REFURBISHED') return 'Restaurado / Reciclado'
  return 'No especificada'
}

/**
 * Muestra el resumen completo de la publicación con galería de imágenes
 */
function PublicationSummary({ listingData, setStep }) {
  const {
    title,
    price,
    imageUrls, // URLs de S3 (si ya se subieron)
    imageFiles, // Archivos locales (si aún no se subieron)
    location,
    type,
    category,
    description,
    quantity,
    condition,
  } = listingData

  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [localPreviews, setLocalPreviews] = useState([])

  // Crear previews locales de los archivos si no hay URLs de S3
  useEffect(() => {
    if (imageFiles && imageFiles.length > 0 && (!imageUrls || imageUrls.length === 0)) {
      const previews = imageFiles.map(file => URL.createObjectURL(file))
      setLocalPreviews(previews)
      
      return () => {
        // Limpiar URLs de blob al desmontar
        previews.forEach(url => URL.revokeObjectURL(url))
      }
    } else {
      setLocalPreviews([])
    }
  }, [imageFiles, imageUrls])

  // Resetear índice cuando cambien las imágenes
  useEffect(() => {
    setMainImageIndex(0)
  }, [imageUrls, localPreviews])

  // Usar URLs de S3 si existen, sino usar previews locales
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : localPreviews
  const mainImageUrl =
    images[mainImageIndex] ||
    'https://via.placeholder.com/300x300.png?text=Sin+Imagen'

  const openLightbox = index => {
    setMainImageIndex(index)
    setShowLightbox(true)
  }

  const changeLightboxImage = direction => {
    setMainImageIndex(prev => {
      const newIndex = prev + direction
      if (newIndex < 0) return images.length - 1
      if (newIndex >= images.length) return 0
      return newIndex
    })
  }

  return (
    <div className="w-full rounded-lg bg-neutral-100 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna de Imagen (Galería) */}
        <div className="flex-shrink-0 lg:w-2/5">
          {/* Imagen Principal */}
          <div className="relative aspect-square w-full">
            <img
              src={mainImageUrl}
              alt={title || 'Vista previa'}
              className="rounded-lg cursor-pointer w-full h-full object-cover"
              onClick={() => openLightbox(mainImageIndex)}
              onError={(e) => {
                console.error('Error cargando imagen:', mainImageUrl)
                e.target.src = 'https://via.placeholder.com/300x300.png?text=Error+cargando'
              }}
            />
            {images.length > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                <Camera size={14} />
                <span>
                  {mainImageIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto p-1">
              {images.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  className={`h-16 w-16 rounded-md object-cover cursor-pointer border-2 transition-all ${
                    mainImageIndex === index
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-neutral-400'
                  }`}
                  onClick={() => setMainImageIndex(index)}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setStep(3)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-sm text-primary-500 hover:underline"
          >
            <Edit2 size={14} /> Editar Multimedia
          </button>
        </div>

        {/* Columna de Detalles */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start border-b border-neutral-300 pb-4">
            <h4 className="font-roboto text-xl font-bold text-neutral-900 break-words">
              {title || 'Título de tu publicación'}
            </h4>
            <button
              onClick={() => setStep(2)}
              className="flex-shrink-0 ml-4 flex items-center gap-1 text-sm text-primary-500 hover:underline"
            >
              <Edit2 size={14} /> Editar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
            <DetailItem
              label="Precio"
              value={`$${parseFloat(price || 0).toFixed(2)} MXN`}
            />
            <DetailItem label="Cantidad" value={quantity} />
            <DetailItem label="Tipo" value={formatType(type)} />
            <DetailItem
              label="Categoría"
              value={category}
              placeholder="No especificada"
            />
            <DetailItem
              label="Condición"
              value={formatCondition(condition)}
            />
            <DetailItem
              label="Ubicación"
              value={location}
              placeholder="Dirección, colonia, ciudad."
            />
            <div className="col-span-2">
              <DetailItem
                label="Descripción"
                value={description}
                placeholder="Sin descripción."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white"
            onClick={() => setShowLightbox(false)}
          >
            <X size={32} />
          </button>
          
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); changeLightboxImage(-1); }}
            disabled={images.length <= 1}
          >
            <ChevronLeft size={40} />
          </button>
          
          <img
            src={images[mainImageIndex]}
            alt="Vista previa"
            className="max-h-full max-w-full object-contain"
            onClick={e => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
          />
          
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); changeLightboxImage(1); }}
            disabled={images.length <= 1}
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}
    </div>
  )
}
// --- FIN DE CORRECCIÓN FUNCIONAL ---

/**
 * Este es el Paso 4: Revisión.
 */
export default function Step4_Review({
  onPublish,
  onBack,
  listingData,
  setStep,
  updateListingData,
  onSuccess, // ✅ Callback para mostrar modal de éxito
}) {
  const openConfirmModal = useConfirmStore(state => state.open)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const handlePublishClick = () => {
    // --- INICIO DE CORRECCIÓN FUNCIONAL ---
    // Validar que la ubicación no esté vacía antes de publicar
    if (!listingData.location || listingData.location.trim() === '') {
      // Usar el modal para mostrar el error
      openConfirmModal(
        'Ubicación Requerida',
        'Por favor, regresa al Paso 2 o edita la ubicación en este paso antes de publicar.',
        () => {}, // No hacer nada al "confirmar"
        { danger: true, confirmText: 'Entendido' }
      )
      return
    }
    // --- FIN DE CORRECCIÓN FUNCIONAL ---

    openConfirmModal(
      'Confirmación de publicación',
      'Estas a punto de enviar tu publicación. De acuerdo con nuestras reglas de negocio, pasara primero a revisión por un administrador antes de ser visible en el Marketplace.\n\nTu publicación tendrá el estado “Pendiente de Aprobación”.',
      handleConfirmPublish,
      { danger: false, confirmText: 'Confirmar y enviar' }
    )
  }

  const handleConfirmPublish = async () => {
    // NUEVO FLUJO: Crear listing primero (sin imágenes), luego subir imágenes con el ID real
    try {
      setIsUploading(true)
      
      // Si hay archivos locales, subirlos DESPUÉS de crear el listing
      if (listingData.imageFiles && listingData.imageFiles.length > 0) {
        setUploadProgress('Creando publicación...')
        
        // 1. Crear el listing primero SIN imágenes
        const createdListing = await onPublish([]) // Array vacío de imágenes
        
        if (!createdListing || !createdListing.listing_id) {
          throw new Error('No se pudo obtener el listing_id del listing creado')
        }
        
        console.log('[Step4] Listing creado con ID:', createdListing.listing_id)
        
        // 2. Ahora subir imágenes con el listing_id REAL
        setUploadProgress(`Subiendo ${listingData.imageFiles.length} imagen(es) a S3...`)
        
        const uploadedUrls = await uploadService.uploadMultipleImages(
          listingData.imageFiles,
          createdListing.listing_id, // ✅ ID real del listing
          0 // Primera imagen es la principal
        )

        console.log('[Step4] URLs subidas a S3:', uploadedUrls)
        
        // 3. Agregar las imágenes al listing usando el endpoint
        setUploadProgress('Asociando imágenes al listing...')
        await listingsService.addImages(createdListing.listing_id, uploadedUrls)
        
        console.log('[Step4] Imágenes asociadas correctamente al listing')
        
        setUploadProgress('¡Publicación completada!')
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress('')
          // Mostrar modal de éxito DESPUÉS de completar todo
          if (onSuccess) onSuccess()
        }, 800)
        
      } else {
        // No hay imágenes, solo crear el listing
        setUploadProgress('Creando publicación...')
        await onPublish([])
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress('')
          // Mostrar modal de éxito
          if (onSuccess) onSuccess()
        }, 500)
      }
    } catch (error) {
      console.error('[Step4] Error en el flujo de publicación:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error desconocido'
      alert(`Error al publicar: ${errorMsg}`)
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  // Manejador para el input de ubicación
  const handleLocationChange = e => {
    updateListingData({ location: e.target.value })
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-5">
        <h2 className="font-poppins text-3xl font-semibold text-primary-500">
          Paso 4: Revisa y publica
        </h2>
        <p className="font-inter text-base text-neutral-900">
          Así se verá tu publicación. Revisa que toda la información sea correcta.
        </p>

        <div>
          <h3 className="mb-2 font-roboto text-xl font-bold text-neutral-900">
            Resumen de Publicación
          </h3>
          {/* --- INICIO DE CORRECCIÓN FUNCIONAL --- */}
          <PublicationSummary listingData={listingData} setStep={setStep} />
          {/* --- FIN DE CORRECCIÓN FUNCIONAL --- */}
        </div>

        <hr className="border-t border-neutral-300" />

        {/* Mostrar progreso de upload si está subiendo */}
        {isUploading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <span className="text-sm font-semibold text-neutral-700">{uploadProgress}</span>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={onBack}
            disabled={isUploading}
            className="rounded-lg bg-neutral-200 px-6 py-3 font-inter text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Antes
          </button>
          <button
            onClick={handlePublishClick}
            disabled={isUploading}
            className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo imágenes...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}