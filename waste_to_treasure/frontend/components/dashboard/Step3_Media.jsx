'use client'

// --- INICIO DE CORRECCIÓN FUNCIONAL ---
import { useState, useRef, useCallback } from 'react'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'
// --- FIN DE CORRECCIÓN FUNCIONAL ---

export default function Step3_Media({
  onNext,
  onBack,
  listingData,
  updateListingData,
}) {
  // --- INICIO DE CORRECCIÓN FUNCIONAL ---
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Función principal para manejar los archivos
  const handleFiles = files => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length > 0) {
      updateListingData({
        images: [...listingData.images, ...imageFiles],
      })
    }
  }

  // Manejadores de Drag-and-Drop
  const handleDragOver = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files && files.length) {
        handleFiles(files)
      }
    },
    [listingData, updateListingData] // Dependencias actualizadas
  )

  // Manejador para el clic en el botón/área
  const handleAreaClick = () => {
    fileInputRef.current?.click()
  }

  // Manejador para el input de archivo
  const handleFileSelect = e => {
    const files = e.target.files
    if (files && files.length) {
      handleFiles(files)
    }
  }

  // Manejador para eliminar una imagen
  const handleRemoveImage = index => {
    const newImages = [...listingData.images]
    newImages.splice(index, 1)
    updateListingData({ images: newImages })
  }
  // --- FIN DE CORRECCIÓN FUNCIONAL ---

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-primary-500 text-2xl md:text-3xl font-poppins font-bold">
          Paso 3: Multimedia
        </h2>

        <p className="text-neutral-600">
          Añade fotos de tu producto o material. La primera foto será la portada.
        </p>

        {/* --- INICIO DE CORRECCIÓN FUNCIONAL --- */}
        {/* Dropzone Interactivo */}
        <div
          className={`
            w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center
            cursor-pointer transition-colors
            ${
              isDragging
                ? 'border-primary-500 bg-green-50'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-500/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleAreaClick}
        >
          <UploadCloud className="w-12 h-12 text-gray-400" />
          <span className="mt-2 block text-sm font-semibold text-gray-700">
            Arrastra y suelta tus fotos aquí
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            o haz clic para seleccionar (Se recomiendan imágenes)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Previsualización de Imágenes */}
        {listingData.images.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Imágenes cargadas ({listingData.images.length})
            </h3>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listingData.images.map((file, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Previsualización ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full"
                    onLoad={e => URL.revokeObjectURL(e.target.src)}
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* --- FIN DE CORRECCIÓN FUNCIONAL --- */}

        {/* Divisor y Botones */}
        <hr className="border-t border-gray-200 dark:border-gray-700" />
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-200 text-gray-800 font-inter font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-[#396530] text-white font-inter font-semibold rounded-lg hover:bg-green-900 dark:hover:bg-green-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}