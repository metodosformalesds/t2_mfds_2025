'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart,
  LogOut,
  User,
  PlusCircle,
  Menu, // Icono de hamburguesa
  X, // Icono de cerrar
  LayoutDashboard, // Icono para "Mi Panel"
  DollarSign, // Icono para "Mis Ventas"
  CreditCard, // Icono para "Suscripciones"
  Shield, // Icono para "Panel Admin"
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
// --- INICIO DE MODIFICACIÓN ---
import { useCartStore } from '@/stores/useCartStore'
// --- FIN DE MODIFICACIÓN ---

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  // --- INICIO DE MODIFICACIÓN ---
  const { total_items, fetchCart } = useCartStore()
  // --- FIN DE MODIFICACIÓN ---

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Refs para cerrar menús al hacer clic fuera
  const profileMenuRef = useRef(null)
  const profileToggleRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const mobileToggleRef = useRef(null)

  // --- INICIO DE MODIFICACIÓN ---
  // Cargar el carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])
  // --- FIN DE MODIFICACIÓN ---

  useEffect(() => {
    const handleClickOutside = event => {
      // Cerrar menú de perfil
      if (
        isProfileOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        profileToggleRef.current &&
        !profileToggleRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false)
      }

      // Cerrar menú móvil
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen, isMobileMenuOpen])

  // --- Enlaces del menú de usuario ---
  const userLinks = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Mi panel',
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'Gestión de perfil',
    },
    {
      href: '/dashboard/purchases',
      icon: ShoppingCart,
      label: 'Mis compras',
    },
    {
      href: '/dashboard/sales',
      icon: DollarSign,
      label: 'Mis ventas',
    },
    {
      href: '/dashboard/subscription',
      icon: CreditCard,
      label: 'Suscripciones',
    },
  ]

  // --- Enlaces adicionales para administradores ---
  const adminLinks = user?.role === 'ADMIN' ? [
    {
      href: '/admin',
      icon: Shield,
      label: 'Panel de Administración',
    },
  ] : []

  // --- Enlaces de navegación principal del sitio ---
  const siteLinks = (
    <>
      <Link
        href="/materials"
        className="font-inter text-base text-neutral-900 hover:text-primary-500"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Materiales
      </Link>
      <Link
        href="/products"
        className="font-inter text-base text-neutral-900 hover:text-primary-500"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Productos
      </Link>
      <Link
        href="/plans"
        className="font-inter text-base text-neutral-900 hover:text-primary-500"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Planes
      </Link>
    </>
  )
  
  // --- INICIO DE MODIFICACIÓN ---
  // Componente de ícono de carrito reutilizable
  const CartIcon = ({ isMobile = false }) => (
    <Link
      href="/cart"
      aria-label="Carrito de compras"
      className="relative rounded-full p-2 text-neutral-900 hover:bg-neutral-100"
      onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
    >
      <ShoppingCart className="h-6 w-6 text-primary-500" />
      {total_items > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-600 text-xs font-bold text-white">
          {total_items}
        </span>
      )}
    </Link>
  )
  // --- FIN DE MODIFICACIÓN ---


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Columna Izquierda (Logo) - Redirige a /marketplace si está logueado */}
          <div className="flex flex-1 justify-start">
            <Link
              href={isAuthenticated ? '/materials' : '/'}
              className="flex-shrink-0"
            >
              <Image
                src="/images/LogoFondoBlanco.webp"
                alt="Waste to Treasure Logo"
                width={80}
                height={62}
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Columna Central (Navegación) - AHORA SIEMPRE VISIBLE */}
          <nav className="hidden flex-1 justify-center gap-8 md:flex">
            {siteLinks}
          </nav>

          {/* Columna Derecha (Acciones de Escritorio) - Oculta en móvil */}
          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            {isAuthenticated ? (
              <>
                {/* --- INICIO DE MODIFICACIÓN --- */}
                <CartIcon />
                {/* --- FIN DE MODIFICACIÓN --- */}

                {/* --- Menú de Perfil --- */}
                <div className="relative">
                  <button
                    ref={profileToggleRef}
                    onClick={() => setIsProfileOpen(prev => !prev)}
                    className="rounded-full p-2 text-neutral-900 hover:bg-neutral-100"
                    aria-label="Abrir menú de usuario"
                  >
                    <User className="h-6 w-6 text-primary-500" />
                  </button>

                  {/* --- Contenido del Menú Desplegable de Perfil --- */}
                  {isProfileOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        <div className="border-b border-neutral-200 px-4 py-3">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            ¡Hola!, {user?.name}
                          </p>
                        </div>
                        <div className="py-1">
                          {userLinks.map(link => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <link.icon
                                className="mr-3 h-5 w-5 text-neutral-500"
                                aria-hidden="true"
                              />
                              {link.label}
                            </Link>
                          ))}
                          {adminLinks.map(link => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex w-full items-center px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <link.icon
                                className="mr-3 h-5 w-5 text-primary-500"
                                aria-hidden="true"
                              />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-neutral-200 py-1">
                          <button
                            onClick={() => {
                              logout()
                              setIsProfileOpen(false)
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <LogOut
                              className="mr-3 h-5 w-5"
                              aria-hidden="true"
                            />
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* --- Botones de No Autenticado (Escritorio) --- */}
                <Link
                  href="/login"
                  className="rounded-lg border-2 border-primary-500 px-5 py-2 text-base font-semibold text-primary-500 transition-colors hover:bg-primary-500/10"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary-500 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-primary-600"
                >
                  Regístrate
                </Link>
                {/* --- INICIO DE MODIFICACIÓN --- */}
                <CartIcon />
                {/* --- FIN DE MODIFICACIÓN --- */}
              </>
            )}
          </div>

          {/* --- Botón de Menú Móvil --- */}
          <div className="flex flex-1 items-center justify-end md:hidden">
            {/* --- INICIO DE MODIFICACIÓN --- */}
            <CartIcon isMobile />
            {/* --- FIN DE MODIFICACIÓN --- */}
            <button
              ref={mobileToggleRef}
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-neutral-900 hover:bg-neutral-100"
              aria-label="Abrir menú principal"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Contenedor del Menú Móvil (Pantalla Completa) --- */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-50 bg-white p-4 md:hidden"
        >
          <div className="flex items-center justify-between">
            <Link
              href={isAuthenticated ? '/materials' : '/'}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Image
                src="/images/LogoFondoBlanco.webp"
                alt="Waste to Treasure Logo"
                width={80}
                height={62}
                className="h-16 w-auto"
              />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-2 text-neutral-900 hover:bg-neutral-100"
              aria-label="Cerrar menú"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* --- Enlaces del Menú Móvil --- */}
          <div className="mt-6">
            <div className="flex flex-col gap-y-4">
              {/* --- MODIFICADO: Navegación principal (siempre visible) --- */}
              <p className="px-4 text-sm font-semibold uppercase text-neutral-500">
                Explorar
              </p>
              <div className="ml-3 flex flex-col gap-y-4">{siteLinks}</div>

              <div className="my-2 border-t border-neutral-200" />
              {/* --- FIN DE MODIFICACIÓN --- */}

              {isAuthenticated ? (
                <>
                  {/* --- Menú Autenticado (Móvil) --- */}
                  <p className="px-4 text-sm font-semibold uppercase text-neutral-500">
                    Mi Cuenta
                  </p>
                  {userLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="-m-3 flex items-center rounded-lg p-3 text-base font-medium text-neutral-900 hover:bg-neutral-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <link.icon
                        className="mr-3 h-6 w-6 flex-shrink-0 text-primary-500"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  ))}
                  {adminLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="-m-3 flex items-center rounded-lg p-3 text-base font-medium text-primary-600 hover:bg-primary-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <link.icon
                        className="mr-3 h-6 w-6 flex-shrink-0 text-primary-500"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  ))}

                  <div className="my-2 border-t border-neutral-200" />

                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="-m-3 flex w-full items-center rounded-lg p-3 text-left text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut
                      className="mr-3 h-6 w-6 flex-shrink-0"
                      aria-hidden="true"
                    />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  {/* --- Menú No Autenticado (Móvil) --- */}
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-lg border-2 border-primary-500 px-5 py-3 text-base font-semibold text-primary-500 transition-colors hover:bg-primary-500/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Regístrate
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}