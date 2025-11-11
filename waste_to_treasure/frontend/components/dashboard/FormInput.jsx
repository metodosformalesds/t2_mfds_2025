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
      <label
        htmlFor={id}
        className="block text-sm font-medium text-dar mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <InputComponent
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-3 border border-gray-400 dark:border-gray-600 rounded-xl
                   bg-dark
                   focus:ring-2 focus:ring-[#396530] focus:border-transparent
                   disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={type === 'textarea' ? 4 : undefined} // Altura para textarea
        {...props}
      />
    </div>
  );
}