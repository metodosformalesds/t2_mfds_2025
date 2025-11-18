/**
 * Autor: Oscar Alonso Nava Rivera
 * Fecha: 17/11/2025
 * Componente: ResetPasswordPage (reset-password/page.jsx)
 * Descripción: Página para restablecer contraseña con código de verificación de AWS Cognito.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { confirmPassword } from '@/lib/auth/cognito';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Recuperar email de localStorage si existe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('reset-email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validatePassword = (password) => {
    // AWS Cognito requiere mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!hasUpperCase) {
      return 'La contraseña debe contener al menos una letra mayúscula';
    }
    if (!hasLowerCase) {
      return 'La contraseña debe contener al menos una letra minúscula';
    }
    if (!hasNumbers) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!hasSpecialChar) {
      return 'La contraseña debe contener al menos un carácter especial';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Validaciones
    if (!formData.email || !formData.code || !formData.newPassword || !formData.confirmPassword) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    // Validar formato de contraseña
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      await confirmPassword(formData.email, formData.code, formData.newPassword);
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reset-email');
      }
      
      setMessage('¡Contraseña restablecida exitosamente! Redirigiendo al inicio de sesión...');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error en reset password:', error);
      
      if (error.code === 'CodeMismatchException') {
        setError('El código de verificación es incorrecto');
      } else if (error.code === 'ExpiredCodeException') {
        setError('El código ha expirado. Por favor solicita uno nuevo');
      } else if (error.code === 'InvalidPasswordException') {
        setError('La contraseña no cumple con los requisitos de seguridad');
      } else if (error.code === 'LimitExceededException') {
        setError('Demasiados intentos. Por favor intenta más tarde');
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
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-10 -top-8 w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-70 blur-xl" />
        <div className="absolute left-[35%] -top-14 w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-55 blur-xl" />
        <div className="absolute right-[10%] -top-48 w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-50 blur-xl" />
        <div className="absolute left-[12%] top-[50%] w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-45 blur-xl" />
        <div className="absolute right-[8%] top-[35%] w-[267px] h-[450px] rounded-full bg-[#5AA44B] opacity-40 blur-xl" />
        <div className="absolute -left-28 bottom-20 w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-65 blur-xl" />
        <div className="absolute right-[15%] bottom-[-100px] w-[339px] h-[339px] rounded-full bg-[#5AA44B] opacity-50 blur-xl" />
        <div className="absolute left-[55%] bottom-[-50px] w-[263px] h-[263px] rounded-full bg-[#5AA44B] opacity-70 blur-xl" />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[611px] p-8 md:p-10 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href={'/'} className="flex-shrink-0">
            <Image
              src="/images/LogoFondoBlanco.webp"
              alt="Waste to Treasure Logo"
              width={112}
              height={96}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold text-[#313039] text-center mb-2 font-poppins">
          Restablecer Contraseña
        </h1>
        <p className="text-center text-base text-[#666666] mb-6">
          Ingresa el código que recibiste por correo y tu nueva contraseña
        </p>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#396539] focus:border-transparent outline-none transition-all text-lg"
              placeholder="correo@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Verification Code Input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Código de verificación
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#396539] focus:border-transparent outline-none transition-all text-lg"
              placeholder="123456"
              required
              disabled={isLoading}
              maxLength={6}
            />
            <p className="mt-1 text-sm text-gray-500">
              Revisa tu correo electrónico para obtener el código
            </p>
          </div>

          {/* New Password Input */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#396539] focus:border-transparent outline-none transition-all pr-12 text-lg"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 8 caracteres, incluye mayúsculas, minúsculas, números y caracteres especiales
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#396539] focus:border-transparent outline-none transition-all pr-12 text-lg"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#396539] hover:bg-[#294730] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <div>
            <Link 
              href="/forgot-password" 
              className="text-sm text-[#A2704F] hover:text-[#69391E] font-medium transition-colors"
            >
              ¿No recibiste el código? Solicitar nuevamente
            </Link>
          </div>
          <div>
            <Link 
              href="/login" 
              className="text-sm text-[#A2704F] hover:text-[#69391E] font-medium transition-colors"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
