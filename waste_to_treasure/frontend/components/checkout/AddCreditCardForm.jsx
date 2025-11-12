'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import FormInput from '@/components/dashboard/FormInput'
import Checkbox from '@/components/ui/Checkbox'

// --- INICIO DE MODIFICACIÓN: Funciones de formato UX ---
/**
 * Formatea el número de tarjeta (0000 0000 0000 0000)
 */
const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  const matches = v.match(/\d{4,16}/g)
  const match = (matches && matches[0]) || ''
  const parts = []
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }
  if (parts.length) {
    return parts.join(' ')
  } else {
    return value
  }
}

/**
 * Limita el CVC a 4 dígitos numéricos
 */
const formatCVC = (value) => {
  return value.replace(/[^0-9]/g, '').slice(0, 4)
}

/**
 * Permite solo letras y espacios en el nombre
 */
const formatName = (value) => {
  return value.replace(/[^a-zA-Z\s]/g, '')
}
// --- FIN DE MODIFICACIÓN ---


export default function AddCreditCardForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    month: '01',
    year: '2025',
    cvc: '',
    is_default: true,
  })

  const handleChange = (e) => {
    let { name, value } = e.target
    
    // --- INICIO DE MODIFICACIÓN: Aplicar formato ---
    if (name === 'number') {
      value = formatCardNumber(value)
    }
    if (name === 'cvc') {
      value = formatCVC(value)
    }
    if (name === 'name') {
      value = formatName(value)
    }
    // --- FIN DE MODIFICACIÓN ---

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // En una app real, aquí se llamaría a Stripe.js para tokenizar
    // Como es un mock, solo pasamos los datos.
    console.log('Guardando tarjeta (mock):', formData)
    
    // Simulamos un ID de tarjeta guardada
    const mockPaymentMethodId = `card_mock_${formData.number.slice(-4)}`
    onSave(mockPaymentMethodId, formData.number.slice(-4))
  }

  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  )
  const years = Array.from({ length: 10 }, (_, i) =>
    (new Date().getFullYear() + i).toString()
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex animate-fade-in flex-col gap-6 rounded-lg border border-neutral-300 bg-white p-6 shadow-inner"
    >
      <h3 className="text-center font-roboto text-3xl font-bold text-black">
        Agregar una tarjeta de débito o crédito
      </h3>

      <div className="flex flex-col gap-6 border-b border-neutral-300 pb-6 md:flex-row">
        {/* Columna Izquierda: Formulario */}
        <div className="flex-1 space-y-4">
          <FormInput
            id="number"
            name="number"
            label="Número de tarjeta"
            value={formData.number}
            onChange={handleChange}
            placeholder="0000 0000 0000 0000"
            required
            maxLength={19} // 16 dígitos + 3 espacios
          />
          <FormInput
            id="name"
            name="name"
            label="Nombre de la tarjeta"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ignacio Lopez"
            required
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="month"
                className="mb-1 block text-sm font-medium text-neutral-600"
              >
                Fecha de vencimiento
              </label>
              <div className="relative">
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-neutral-300 p-3 pr-10 focus:border-primary-500 focus:outline-none"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="year"
                className="mb-1 block text-sm font-medium text-neutral-600"
              >
                &nbsp;
              </label>
              <div className="relative">
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-neutral-300 p-3 pr-10 focus:border-primary-500 focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              </div>
            </div>
          </div>

          <FormInput
            id="cvc"
            name="cvc"
            label="Código de seguridad"
            value={formData.cvc}
            onChange={handleChange}
            placeholder="***"
            required
            maxLength={4}
          />

          <Checkbox
            label="Usar como mi pago predeterminada"
            checked={formData.is_default}
            onChange={() =>
              setFormData((prev) => ({ ...prev, is_default: !prev.is_default }))
            }
          />
        </div>

        {/* Columna Derecha: Info Tarjetas */}
        <div className="w-full border-t pt-4 md:w-52 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="font-inter text-base text-black">
            W2T acepta la mayoría de tarjetas de débito y crédito:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Placeholders de tarjetas */}
            <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500" />
            <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-blue-400 to-pink-500" />
            <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500" />
            <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-400" />
          </div>
        </div>
      </div>

      {/* Acciones del Formulario */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-neutral-200 px-6 py-3 font-inter text-base font-semibold text-neutral-900 transition hover:bg-neutral-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition hover:bg-primary-600"
        >
          Agregar tarjeta
        </button>
      </div>
    </form>
  )
}