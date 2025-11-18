/**
 * Componente de placeholder para imágenes
 * Genera un SVG inline como placeholder cuando no hay imagen disponible
 */

export default function ImagePlaceholder({ 
  width = 300, 
  height = 200, 
  text = 'Sin imagen',
  className = '' 
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width={width} height={height} fill="#e5e7eb" />
      <circle cx={width / 2} cy={height / 2 - 20} r="30" fill="#9ca3af" />
      <path
        d={`M ${width / 2 - 40} ${height / 2 + 20} Q ${width / 2} ${height / 2 - 10} ${width / 2 + 40} ${height / 2 + 20}`}
        stroke="#9ca3af"
        strokeWidth="3"
        fill="none"
      />
      <text
        x={width / 2}
        y={height / 2 + 50}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="14"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {text}
      </text>
    </svg>
  )
}

/**
 * Genera un data URI para usar como src de imagen
 */
export function getPlaceholderDataUri(width = 300, height = 200, text = 'Sin imagen') {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
      <circle cx="${width / 2}" cy="${height / 2 - 20}" r="30" fill="#9ca3af"/>
      <path d="M ${width / 2 - 40} ${height / 2 + 20} Q ${width / 2} ${height / 2 - 10} ${width / 2 + 40} ${height / 2 + 20}" stroke="#9ca3af" stroke-width="3" fill="none"/>
      <text x="${width / 2}" y="${height / 2 + 50}" text-anchor="middle" fill="#6b7280" font-size="14" font-family="system-ui, -apple-system, sans-serif">${text}</text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
