'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { signUp, resendConfirmationCode } from '@/lib/auth/cognito';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phonenumber: '',
    password: '',
  });
  const [countryCode, setCountryCode] = useState('+52');
  const [sendSmsIfAvailable, setSendSmsIfAvailable] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!formData.phonenumber.trim()) {
      newErrors.phonenumber = 'El número de teléfono es requerido';
    } else if (!/^\+?\d{7,15}$/.test(formData.phonenumber)) {
      // Permitimos formato E.164 (+521234567890) o solo dígitos (7-15)
      newErrors.phonenumber = 'Número inválido. Usa formato E.164 (ej. +521234567890) o solo dígitos (sin espacios)';
    }
        
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Normalizar teléfono a E.164 si es necesario
      let phoneToSend = formData.phonenumber.trim();
      const defaultCC = process.env.NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE || '';

      if (!phoneToSend.startsWith('+')) {
        // Solo dígitos ingresados
        if (/^\d{7,15}$/.test(phoneToSend)) {
          // Use selector first, otherwise fallback to NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE
          const ccFromSelector = countryCode || '';
          if (ccFromSelector) {
            const cc = ccFromSelector.startsWith('+') ? ccFromSelector : `+${ccFromSelector}`;
            phoneToSend = `${cc}${phoneToSend}`;
          } else if (defaultCC) {
            const cc = defaultCC.startsWith('+') ? defaultCC : `+${defaultCC}`;
            phoneToSend = `${cc}${phoneToSend}`;
          } else {
            setErrors({ phonenumber: 'Incluye el código de país (ej. +52) o configura NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE en .env' });
            setIsLoading(false);
            return;
          }
        }
      }

      // Log final phone for testing/validation
      console.log('Normalized phone to send (E.164):', phoneToSend);

      // Registrar usuario en AWS Cognito (incluyendo phone_number si aplica)
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: phoneToSend,
      });

      console.log('Registration successful:', result);

      // Guardar email temporalmente para la página de verificación
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingVerificationEmail', formData.email);
        if (phoneToSend) sessionStorage.setItem('pendingVerificationPhone', phoneToSend);
        if (sendSmsIfAvailable) sessionStorage.setItem('verificationRequestedViaSms', 'true');
      }

      // Si el usuario pidió envío por SMS, intentar forzar el re-envío (Cognito decide canal)
      if (sendSmsIfAvailable) {
        try {
          await resendConfirmationCode(formData.email);
          console.log('Resend confirmation code requested');
        } catch (err) {
          console.warn('No se pudo solicitar reenvío de confirmación por SMS/email:', err);
        }
      }

      // Redirigir a página de verificación de email
      router.push('/verify-email');

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Error al crear la cuenta. Intenta de nuevo.';
      
      // Manejar errores específicos de Cognito
      if (error.code === 'UsernameExistsException') {
        errorMessage = 'Este correo electrónico ya está registrado';
      } else if (error.code === 'InvalidPasswordException') {
        errorMessage = 'La contraseña no cumple con los requisitos';
      } else if (error.code === 'InvalidParameterException') {
        errorMessage = 'Datos inválidos. Verifica la información';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    console.log(`Register with ${provider}`);
    // TODO: Implementar OAuth con Cognito
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#396539] to-[#294730] overflow-hidden flex items-center justify-center p-4">
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

      {/* Registration Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[611px] p-8 md:p-10 z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4">
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
          Crear cuenta
        </h1>

        {/* Subtitle */}
        <p className="text-center text-base text-[#666666] mb-8">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#A2704F] hover:text-[#69391E] font-semibold transition-colors">
            Inicia sesión
          </Link>
        </p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          {/* First Name */}
          <div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Nombre"
              className={`w-full h-[50px] px-4 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#396539] transition-all ${
                errors.firstName ? 'border-red-500' : 'border-[#666666]'
              }`}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Apellido"
              className={`w-full h-[50px] px-4 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#396539] transition-all ${
                errors.lastName ? 'border-red-500' : 'border-[#666666]'
              }`}
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Correo electrónico"
              className={`w-full h-[50px] px-4 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#396539] transition-all ${
                errors.email ? 'border-red-500' : 'border-[#666666]'
              }`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
            <div>
              <div className="flex gap-3 items-center">
                <select
                  aria-label="Código de país"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[50px] px-3 rounded-xl border border-[#666666] bg-white text-sm"
                >
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>

                <input
                  type="tel"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleChange}
                  placeholder="Número de teléfono"
                  className={`flex-1 h-[50px] px-4 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#396539] transition-all ${
                    errors.phonenumber ? 'border-red-500' : 'border-[#666666]'
                  }`}
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">Incluye o selecciona el código de país. Si ingresas un número con + al inicio el selector se ignorará.</p>
              {errors.phonenumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phonenumber}</p>
              )}

              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={sendSmsIfAvailable}
                  onChange={(e) => setSendSmsIfAvailable(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span>Solicitar código por SMS si está disponible</span>
              </label>
            </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              className={`w-full h-[50px] px-4 pr-32 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#396539] transition-all ${
                errors.password ? 'border-red-500' : 'border-[#666666]'
              }`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[rgba(0,0,0,0.75)] hover:text-black transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              <span className="text-sm">{showPassword ? 'Ocultar' : 'Mostrar'}</span>
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[50px] bg-[#396530] hover:bg-[#294730] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-black">O</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Social Registration Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialRegister('google')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 26 26" fill="none">
              <path d="M23.745 13.186c0-.866-.076-1.698-.22-2.496H13.28v4.72h5.877a5.023 5.023 0 01-2.179 3.298v3.066h3.527c2.065-1.902 3.26-4.702 3.26-8.022z" fill="#4285F4"/>
              <path d="M13.28 24c2.948 0 5.422-.977 7.229-2.643l-3.527-3.066c-.977.654-2.227 1.041-3.702 1.041-2.849 0-5.26-1.925-6.123-4.51H3.489v3.16A12.001 12.001 0 0013.28 24z" fill="#34A853"/>
              <path d="M7.157 14.822a7.22 7.22 0 010-4.644V7.018H3.489a12.001 12.001 0 000 10.965l3.668-3.161z" fill="#FBBC05"/>
              <path d="M13.28 5.668c1.607 0 3.05.553 4.185 1.637l3.138-3.138C18.696 2.242 16.222 1 13.28 1 8.622 1 4.578 3.58 3.489 7.018l3.668 3.16c.863-2.585 3.274-4.51 6.123-4.51z" fill="#EA4335"/>
            </svg>
            <span className="text-black">Registrarse con Google</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => handleSocialRegister('facebook')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#0C82EE"/>
              <path d="M17.667 20.75v-4.917h1.65l.247-1.916h-1.897v-1.223c0-.555.154-.933.95-.933h1.016V10.09a13.634 13.634 0 00-1.48-.076c-1.464 0-2.467.894-2.467 2.535v1.414h-1.654v1.916h1.654v4.917h1.98z" fill="white"/>
            </svg>
            <span className="text-black">Registrarse con Facebook</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialRegister('apple')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#100F14"/>
              <path d="M18.609 10.033c.617-.754 1.033-1.797 1.033-2.84 0-.142-.012-.285-.036-.392-.986.036-2.171.656-2.883 1.481-.569.641-1.069 1.648-1.069 2.702 0 .154.024.308.036.356.059.012.154.024.249.024.887 0 2.001-.594 2.67-1.331zm3.355 10.643c-.734 1.093-1.516 2.174-2.732 2.174-1.169 0-1.515-.688-2.827-.688-1.359 0-1.823.7-2.945.7-1.169 0-1.988-1.14-2.827-2.35-1.359-1.991-2.402-5.62-1.004-8.066.688-1.21 1.916-1.975 3.249-1.998 1.028-.024 1.999.688 2.626.688.616 0 1.776-.853 3.001-.724.509.012 1.94.202 2.862 1.528-.071.047-1.704 1.001-1.681 2.982.024 2.35 2.056 3.144 2.08 3.156-.012.047-.308 1.081-1.063 2.15l.261.448z" fill="white"/>
            </svg>
            <span className="text-black">Registrarse con Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}
