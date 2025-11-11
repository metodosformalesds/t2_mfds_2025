'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from '@/lib/auth/cognito';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(formData.email, formData.password);
      
      // If remember me is checked, store in localStorage
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', formData.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      console.log('Login exitoso:', result);
      
      // --- MODIFICADO ---
      // Redirigir a /materials en lugar de /
      window.location.href = '/materials';
      // --- FIN DE MODIFICACIÓN ---

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      
      // Handle specific Cognito errors
      if (err.code === 'UserNotConfirmedException') {
        setError('Por favor verifica tu correo electrónico antes de iniciar sesión');
        // Optionally redirect to verify email page
        // router.push('/verify-email');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Correo electrónico o contraseña incorrectos');
      } else if (err.code === 'UserNotFoundException') {
        setError('No existe una cuenta con este correo electrónico');
      } else if (err.code === 'PasswordResetRequiredException') {
        setError('Debes restablecer tu contraseña');
      } else if (err.code === 'TooManyRequestsException' || err.code === 'TooManyFailedAttemptsException') {
        setError('Demasiados intentos fallidos. Por favor intenta más tarde');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // TODO: Implement OAuth when configured in Cognito
    console.log(`Login with ${provider} - Coming soon`);
    setError('Inicio de sesión con redes sociales próximamente');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#396539] to-[#294730] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative circles */}
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

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[611px] p-8 md:p-10 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://www.figma.com/api/mcp/asset/18d60029-5bae-40c2-93da-26c7bc87e664" 
            alt="Waste to Treasure Logo" 
            className="w-28 h-24 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold text-[#313039] text-center mb-2 font-poppins">
          Iniciar Sesión
        </h1>

        {/* Register link */}
        <p className="text-center text-base text-[#666666] mb-6">
          ¿Eres nuevo en Waste to Treasure?{' '}
          <a 
            href="/register" 
            className="text-[#A2704F] hover:text-[#69391E] font-semibold transition-colors"
          >
            Regístrate
          </a>
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
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

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
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
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-[#396539] border-gray-300 rounded focus:ring-[#396539]"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-600">Recordarme</span>
            </label>
            <a 
              href="/forgot-password" 
              className="text-sm text-[#A2704F] hover:text-[#69391E] font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#396539] hover:bg-[#294730] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">O</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 26 26" fill="none">
              <path d="M23.745 13.186c0-.866-.076-1.698-.22-2.496H13.28v4.72h5.877a5.023 5.023 0 01-2.179 3.298v3.066h3.527c2.065-1.902 3.26-4.702 3.26-8.022z" fill="#4285F4"/>
              <path d="M13.28 24c2.948 0 5.422-.977 7.229-2.643l-3.527-3.066c-.977.654-2.227 1.041-3.702 1.041-2.849 0-5.26-1.925-6.123-4.51H3.489v3.16A12.001 12.001 0 0013.28 24z" fill="#34A853"/>
              <path d="M7.157 14.822a7.22 7.22 0 010-4.644V7.018H3.489a12.001 12.001 0 000 10.965l3.668-3.161z" fill="#FBBC05"/>
              <path d="M13.28 5.668c1.607 0 3.05.553 4.185 1.637l3.138-3.138C18.696 2.242 16.222 1 13.28 1 8.622 1 4.578 3.58 3.489 7.018l3.668 3.16c.863-2.585 3.274-4.51 6.123-4.51z" fill="#EA4335"/>
            </svg>
            <span className="text-black">Inicia Sesión con Google</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#0C82EE"/>
              <path d="M17.667 20.75v-4.917h1.65l.247-1.916h-1.897v-1.223c0-.555.154-.933.95-.933h1.016V10.09a13.634 13.634 0 00-1.48-.076c-1.464 0-2.467.894-2.467 2.535v1.414h-1.654v1.916h1.654v4.917h1.98z" fill="white"/>
            </svg>
            <span className="text-black">Inicia Sesión con Facebook</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            disabled={isLoading}
            className="w-full h-[55px] bg-white border border-[rgba(0,0,0,0.3)] rounded-[40px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#100F14"/>
              <path d="M18.609 10.033c.617-.754 1.033-1.797 1.033-2.84 0-.142-.012-.285-.036-.392-.986.036-2.171.656-2.883 1.481-.569.641-1.069 1.648-1.069 2.702 0 .154.024.308.036.356.059.012.154.024.249.024.887 0 2.001-.594 2.67-1.331zm3.355 10.643c-.734 1.093-1.516 2.174-2.732 2.174-1.169 0-1.515-.688-2.827-.688-1.359 0-1.823.7-2.945.7-1.169 0-1.988-1.14-2.827-2.35-1.359-1.991-2.402-5.62-1.004-8.066.688-1.21 1.916-1.975 3.249-1.998 1.028-.024 1.999.688 2.626.688.616 0 1.776-.853 3.001-.724.509.012 1.94.202 2.862 1.528-.071.047-1.704 1.001-1.681 2.982.024 2.35 2.056 3.144 2.08 3.156-.012.047-.308 1.081-1.063 2.15l.261.448z" fill="white"/>
            </svg>
            <span className="text-black">Inicia Sesión con Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}