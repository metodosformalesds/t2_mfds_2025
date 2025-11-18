/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: FormInput
 * Descripción: componente de input reutilizable para formularios que soporta tipo text, textarea, validación, label opcional, placeholder y estilos consistentes
 */

'use client';

/**
 * Componente reutilizable para un input de formulario con label.
 */
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  ...props 
}) {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`w-full ${className}`}>
      {/* Mostrar label solo si se proporciona */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-600 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <InputComponent
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-3 border border-gray-400 dark:border-gray-600 rounded-xl
                   bg-white text-black
                   focus:ring-2 focus:ring-[#396530] focus:border-transparent
                   disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={type === 'textarea' ? 4 : undefined} // Altura para textarea
        {...props}
      />
    </div>
  );
}