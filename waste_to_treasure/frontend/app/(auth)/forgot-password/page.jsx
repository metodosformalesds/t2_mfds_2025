/**
 * Autor: Oscar Alonso Nava Rivera
 * Fecha: 17/11/2025
 * Componente: ForgotPasswordPage (forgot-password/page.jsx)
 * Descripción: Página de recuperación de contraseña usando AWS Cognito.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/auth/cognito';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Basic validation
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      
      // Guardar email en localStorage para usarlo en la siguiente página
      if (typeof window !== 'undefined') {
        localStorage.setItem('reset-email', email);
      }
      
      setMessage('¡Código enviado! Redirigiendo...');
      
      // Redirigir a la página de reset password después de 2 segundos
      setTimeout(() => {
        router.push('/reset-password');
      }, 2000);
      
    } catch (error) {
      console.error('Error en forgot password:', error);
      
      if (error.code === 'UserNotFoundException') {
        setError('No existe una cuenta con este correo electrónico');
      } else if (error.code === 'LimitExceededException') {
        setError('Demasiados intentos. Por favor intenta más tarde');
      } else if (error.code === 'InvalidParameterException') {
        setError('El correo electrónico no es válido');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Ocurrió un error. Por favor intenta de nuevo.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#396539] to-[#294730] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative circles - más sólidos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left small */}
        <div className="absolute -left-10 -top-8 w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-70 blur-xl" />
        
        {/* Top middle large */}
        <div className="absolute left-[35%] -top-14 w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-55 blur-xl" />
        
        {/* Top right large */}
        <div className="absolute right-[10%] -top-48 w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-50 blur-xl" />
        
        {/* Middle left large */}
        <div className="absolute left-[12%] top-[50%] w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-45 blur-xl" />
        
        {/* Middle right */}
        <div className="absolute right-[8%] top-[35%] w-[267px] h-[450px] rounded-full bg-[#5AA44B] opacity-40 blur-xl" />
        
        {/* Bottom left small */}
        <div className="absolute -left-28 bottom-20 w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-65 blur-xl" />
        
        {/* Bottom right large */}
        <div className="absolute right-[15%] bottom-[-100px] w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-50 blur-xl" />
        
        {/* Bottom center small */}
        <div className="absolute left-[55%] bottom-[-50px] w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-70 blur-xl" />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[611px] p-8 md:p-10 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link
            href={'/'}
            className="flex-shrink-0"
          >
            <img 
              src="images/LogoFondoBlanco.webp" 
              alt="Waste to Treasure Logo" 
              className="w-28 h-24 object-contain"
            />
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold text-[#313039] text-center mb-2 font-poppins">
          Recuperar Contraseña
        </h1>
        <p className="text-center text-base text-[#666666] mb-6">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
        </p>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#396539] focus:border-transparent outline-none transition-all text-lg"
              placeholder="correo@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#396539] hover:bg-[#294730] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm text-[#A2704F] hover:text-[#69391E] font-medium transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
