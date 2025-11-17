'use client';

/**
 * Autor: Oscar Alonso Nava Rivera
 * Fecha: 09/11/2025
 * Componente: VerifyEmailPage (verify-email/page.jsx)
 * Descripción: Página para verificar el correo electrónico del usuario.
 */
'use client';
 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { confirmSignUp, resendConfirmationCode } from '@/lib/auth/cognito';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [smsRequested, setSmsRequested] = useState(false);

  useEffect(() => {
    // Obtener el email y phone del registro anterior
    if (typeof window !== 'undefined') {
      const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
      const pendingPhone = sessionStorage.getItem('pendingVerificationPhone');
      const smsFlag = sessionStorage.getItem('verificationRequestedViaSms') === 'true';

      if (pendingEmail) {
        setEmail(pendingEmail);
        if (pendingPhone) setPhone(pendingPhone);
        if (smsFlag) setSmsRequested(true);
      } else {
        // Si no hay email pendiente, redirigir al registro
        router.push('/register');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp(email, code);
      
      setSuccess(true);
      
      // Limpiar el email pendiente
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingVerificationEmail');
        sessionStorage.removeItem('pendingVerificationPhone');
        sessionStorage.removeItem('verificationRequestedViaSms');
      }

      // Esperar un momento y redirigir al login
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);

    } catch (err) {
      console.error('Verification error:', err);
      
      let errorMessage = 'Código de verificación inválido';
      
      if (err.code === 'CodeMismatchException') {
        errorMessage = 'Código incorrecto. Intenta de nuevo';
      } else if (err.code === 'ExpiredCodeException') {
        errorMessage = 'El código ha expirado. Solicita uno nuevo';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      await resendConfirmationCode(email);
      if (phone) {
        setResendMessage('Código reenviado. Revisa tu correo o tu SMS (si está disponible).');
      } else {
        setResendMessage('Código reenviado exitosamente. Revisa tu correo.');
      }
    } catch (err) {
      console.error('Resend code error:', err);
      setError('Error al reenviar el código. Intenta de nuevo.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskPhone = (p) => {
    if (!p) return '';
    // Replace digits except last 4 with * (keep + if present)
    return p.replace(/\d(?=\d{4})/g, '*');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#396539] to-[#294730]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Email Verificado!</h1>
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido verificada exitosamente.
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#396539] to-[#294730]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-20 relative">
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
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2 font-poppins">
          Verifica tu Email
        </h1>

        <p className="text-center text-gray-600 mb-6">
          Hemos enviado un código de verificación a<br />
          <span className="font-semibold">{email}</span>
          {phone && (
            <>
              <br />
              <span className="text-sm text-gray-700">También al número: </span>
              <span className="font-semibold">{maskPhone(phone)}</span>
            </>
          )}
          {smsRequested && (
            <div className="text-sm text-gray-500 mt-2">Se solicitó envío por SMS además de email (si tu número es válido y Cognito está configurado para SMS).</div>
          )}
        </p>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Verificación
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ingresa el código de 6 dígitos"
              className="w-full h-12 px-4 border border-gray-300 rounded-lg text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#396539] focus:border-transparent"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {resendMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#396530] hover:bg-[#294730] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        {/* Resend Code */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            ¿No recibiste el código?
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-[#A2704F] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>

        {/* Back to Register */}
        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver al registro
          </Link>
        </div>
      </div>
    </div>
  );
}
