// Datos para las pestañas
export const faqCategories = [
  { id: 'general', name: 'General' },
  { id: 'account', name: 'Mi Cuenta' },
  { id: 'buying', name: 'Compras' },
  { id: 'selling', name: 'Ventas' },
  { id: 'payments', name: 'Pagos' },
  { id: 'plans', name: 'Planes' },
]

// Datos para las preguntas, organizados por pestaña
export const allFaqs = {
  general: [
    {
      q: '¿Qué es Waste-To-Treasure?',
      a: 'Waste-To-Treasure es un marketplace de economía circular que conecta a empresas con residuos industriales (como plásticos, textiles, madera) con artesanos y talleres locales que pueden transformar esos materiales en nuevos productos. Es un puente entre el desperdicio y la oportunidad.',
    },
    {
      q: '¿Cómo publico mis materiales (como Empresa)?',
      a: 'Debes registrarte con un plan Empresarial. Una vez en tu panel de control (dashboard), podrás crear "listings" de materiales, especificando el tipo, cantidad, precio y ubicación. Nuestro equipo puede ayudarte a optimizar tus publicaciones.',
    },
    {
      q: '¿Cómo vendo mis artesanías (como Artesano)?',
      a: 'Regístrate con un plan Básico o Pro. En tu panel de control, podrás crear "listings" de productos terminados. Sube buenas fotos, describe tu producto y el material reciclado que usaste, ¡y listo!',
    },
  ],
  account: [
    {
      q: '¿Cómo cambio mi contraseña?',
      a: 'Puedes cambiar tu contraseña en la sección "Mi Cuenta" > "Seguridad" dentro de tu panel de control (dashboard).',
    },
    {
      q: 'Olvidé mi contraseña, ¿qué hago?',
      a: 'En la página de "Iniciar Sesión", haz clic en el enlace "¿Olvidaste tu contraseña?". Te enviaremos un correo electrónico con instrucciones para restablecerla.',
    },
  ],
  buying: [
    {
      q: '¿Es seguro comprar aquí?',
      a: 'Sí. Todos los pagos se procesan a través de Stripe, una plataforma líder en pagos seguros. Nosotros no almacenamos la información de tu tarjeta de crédito.',
    },
  ],
  selling: [
    {
      q: '¿Qué tipo de materiales puedo vender?',
      a: 'Puedes vender cualquier residuo industrial o excedente de material que sea seguro y tenga potencial de reutilización, como plásticos (PET, HDPE), textiles (retazos, rollos), madera (tarimas, recortes), metales, vidrio, etc.',
    },
  ],
  payments: [
    {
      q: '¿Cómo funciona el pago de mis productos vendidos?',
      a: 'Usamos Stripe como pasarela de pago segura. Cuando un cliente compra tu producto, el dinero se procesa y se retiene temporalmente. Una vez que confirmas el envío, el pago (menos nuestra comisión de plataforma) se transfiere a tu cuenta bancaria registrada.',
    },
    {
      q: '¿Qué métodos de pago aceptan?',
      a: 'Aceptamos la mayoría de las tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Stripe.',
    },
  ],
  plans: [
    {
      q: '¿Qué son los planes y por qué debería pagar uno?',
      a: 'Los planes nos ayudan a mantener la plataforma y ofrecer mejores herramientas. El plan Básico es gratuito para empezar. Los planes Pro y Empresarial ofrecen publicaciones ilimitadas, comisiones más bajas y mayor visibilidad, ideales para vendedores serios.',
    },
    {
      q: '¿Puedo cambiar mi plan más adelante?',
      a: '¡Claro! Puedes cambiar, mejorar o cancelar tu plan en cualquier momento desde la sección "Suscripción" en tu panel de control.',
    },
  ],
}

// --- NUEVO ---
// Una lista plana de todas las FAQs para simular la búsqueda en la base de datos
// En una app real, esto vendría de tu API (ej: GET /api/v1/faq/search?q=...)
export const searchableFaqs = Object.entries(allFaqs).flatMap(
  ([categoryId, questions]) =>
    questions.map(q => ({
      ...q,
      categoryId: categoryId,
      categoryName: faqCategories.find(c => c.id === categoryId)?.name || '',
    }))
)