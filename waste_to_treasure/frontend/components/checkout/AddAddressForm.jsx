'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import FormInput from '@/components/dashboard/FormInput' // Reutilizamos FormInput
import Checkbox from '@/components/ui/Checkbox'
import { addressService } from '@/lib/api/address'

export default function AddAddressForm({ onAddressAdded, onCancel }) {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    notes: '',
    is_default: false,
    // Campos del formulario de la imagen no-API
    addressType: 'Casa principal',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validar campos requeridos por la API
    if (!formData.street || !formData.city || !formData.state || !formData.postal_code) {
      setError('Calle, Ciudad, Estado y Código Postal son obligatorios.')
      setIsLoading(false)
      return
    }

    try {
      // Combinar notas
      const combinedNotes = `Tipo: ${formData.addressType}. Instrucciones: ${formData.notes}`.trim()

      // Crear el payload para la API (solo campos de la API)
      const apiData = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: 'MX',
        notes: combinedNotes,
        is_default: formData.is_default,
      }

      const newAddress = await addressService.createAddress(apiData)
      onAddressAdded(newAddress) // Notificar al padre que se agregó una dirección
    } catch (err) {
      console.error('Error al crear dirección:', err)
      setError('No se pudo guardar la dirección. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex animate-fade-in flex-col gap-6 rounded-lg border border-neutral-300 bg-white p-6 shadow-inner"
    >
      <h3 className="font-inter text-2xl font-medium text-black">
        Ingresa nueva dirección de envío
      </h3>

      {/* Tipo de dirección (Formulario) */}
      <div className="relative">
        <label htmlFor="addressType" className="mb-1 block text-sm font-medium text-neutral-600">
          Tipo de dirección
        </label>
        <select
          id="addressType"
          name="addressType"
          value={formData.addressType}
          onChange={handleChange}
          className="w-full appearance-none rounded-lg border border-neutral-300 p-3 pr-10 focus:border-primary-500 focus:outline-none"
        >
          <option>Casa principal</option>
          <option>Oficina/Taller</option>
          <option>Otro</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-[42px] h-5 w-5 text-neutral-500" />
      </div>

      {/* Calle y numero (API: street) */}
      <FormInput
        id="street"
        label="Calle y número"
        value={formData.street}
        onChange={handleChange}
        placeholder="Calle, número ext e int"
        required
      />

      {/* Código Postal (API: postal_code) */}
      <FormInput
        id="postal_code"
        label="Código postal"
        value={formData.postal_code}
        onChange={handleChange}
        placeholder="Por ejemplo, 01000"
        required
      />
      {/* TODO: Botón "Validar" podría autocompletar ciudad y estado */}

      {/* Ciudad (API: city) */}
      <FormInput
        id="city"
        label="Ciudad"
        value={formData.city}
        onChange={handleChange}
        placeholder="Ciudad o municipio"
        required
      />

      {/* Estado (API: state) */}
      <FormInput
        id="state"
        label="Estado"
        value={formData.state}
        onChange={handleChange}
        placeholder="Estado, provincia o región"
        required
      />

      {/* Telefono (Formulario) */}
      <FormInput
        id="phone"
        label="Número de teléfono"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+52 *** *** ****"
      />
      <p className="-mt-4 text-sm text-neutral-600">
        Puede ser utilizado durante la entrega
      </p>

      {/* Instrucciones (API: notes) */}
      <div>
        <h4 className="font-inter text-xl font-medium text-black">
          Agregar instrucciones de entrega
        </h4>
        <p className="mb-2 text-sm text-neutral-600">
          ¿Se necesita un código de seguridad o un número de teléfono para
          acceder al edificio?
        </p>
        <FormInput
          id="notes"
          label=""
          type="textarea"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Por ejemplo, 1234"
        />
      </div>

      {/* Default (API: is_default) */}
      <Checkbox
        label="Usar como mi dirección predeterminada"
        checked={formData.is_default}
        onChange={() =>
          setFormData((prev) => ({ ...prev, is_default: !prev.is_default }))
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Acciones */}
      <div className="flex justify-end gap-4 border-t border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-neutral-200 px-6 py-3 font-inter text-base font-semibold text-neutral-900 transition hover:bg-neutral-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : 'Agregar dirección'}
        </button>
      </div>
    </form>
  )
}