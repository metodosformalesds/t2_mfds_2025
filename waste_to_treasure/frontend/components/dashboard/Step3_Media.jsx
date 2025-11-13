'use client'

// --- INICIO DE CORRECCIÓN FUNCIONAL ---
import { useState, useRef, useCallback, useEffect } from 'react'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'
import uploadService from '@/lib/api/upload'
// --- FIN DE CORRECCIÓN FUNCIONAL ---

export default function Step3_Media({
  onNext,
  onBack,
  listingData,
  updateListingData,
}) {
  // --- INICIO DE CORRECCIÓN FUNCIONAL ---
  const [isDragging, setIsDragging] = useState(false)
  const [localPreviews, setLocalPreviews] = useState([]) // Previews locales de archivos
  const fileInputRef = useRef(null)

  // Recrear previews cuando el componente se monta o cuando imageFiles cambia
  useEffect(() => {
    if (listingData.imageFiles && listingData.imageFiles.length > 0) {
      // Crear previews de los archivos existentes
      const previews = listingData.imageFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        status: 'pending'
      }))
      setLocalPreviews(previews)

      // Cleanup: revocar URLs cuando el componente se desmonta
      return () => {
        previews.forEach(p => URL.revokeObjectURL(p.url))
      }
    }
  }, []) // Solo ejecutar al montar el componente

  // Función principal para manejar los archivos
  const handleFiles = async files => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) return

    // Validar archivos antes de agregar
    const { valid, invalid } = uploadService.validateFiles(imageFiles)
    
    if (invalid.length > 0) {
      console.warn('Archivos inválidos:', invalid)
      alert(`Algunos archivos no son válidos:\n${invalid.map(i => i.reason).join('\n')}`)
    }

    if (valid.length === 0) return

    // Validar que no haya duplicados (por nombre y tamaño)
    const currentFiles = listingData.imageFiles || []
    const existingSet = new Set(
      currentFiles.map(f => `${f.name}-${f.size}`)
    )
    
    const { unique, duplicates } = valid.reduce((acc, file) => {
      const key = `${file.name}-${file.size}`
      if (existingSet.has(key)) {
        acc.duplicates.push(file.name)
      } else {
        acc.unique.push(file)
        existingSet.add(key)
      }
      return acc
    }, { unique: [], duplicates: [] })

    if (duplicates.length > 0) {
      alert(`Las siguientes imágenes ya están seleccionadas:\n${duplicates.join('\n')}`)
    }

    if (unique.length === 0) return

    // Crear previews locales inmediatamente (SIN SUBIR A S3)
    const newPreviews = unique.map(file => ({
      file,
      url: URL.createObjectURL(file),
      status: 'pending' // Pendiente de subir
    }))
    
    setLocalPreviews(prev => [...prev, ...newPreviews])
    
    // Actualizar listingData con los archivos únicos
    updateListingData({
      imageFiles: [...currentFiles, ...unique],
    })
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
  const handleRemoveImage = async (index) => {
    // Eliminar de previews locales
    setLocalPreviews(prev => {
      const newPreviews = [...prev]
      // Revocar URL del blob para liberar memoria
      URL.revokeObjectURL(newPreviews[index].url)
      newPreviews.splice(index, 1)
      return newPreviews
    })
    
    // También eliminar del listingData.imageFiles
    const currentFiles = listingData.imageFiles || []
    const newFiles = [...currentFiles]
    newFiles.splice(index, 1)
    updateListingData({ imageFiles: newFiles })
  }

  // Manejador para cuando hace clic en "Siguiente"
  const handleNext = () => {
    // Simplemente avanzar al siguiente paso
    // El upload se hará en Step4 antes de publicar
    onNext()
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
            o haz clic para seleccionar (JPEG, PNG, WebP - máx 5MB)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Previsualización de Imágenes */}
        {localPreviews.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Imágenes ({localPreviews.length})
            </h3>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Mostrar solo previews locales */}
              {localPreviews.map((preview, index) => (
                <div key={`local-${index}`} className="relative aspect-square group">
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className={`rounded-lg object-cover w-full h-full ${
                      preview.status === 'uploading' ? 'opacity-60' : ''
                    }`}
                  />
                  {preview.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    ○ Lista para subir
                  </div>
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      Portada
                    </div>
                  )}
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
            onClick={handleNext}
            className="px-8 py-3 bg-[#396530] text-white font-inter font-semibold rounded-lg hover:bg-green-900 dark:hover:bg-green-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}