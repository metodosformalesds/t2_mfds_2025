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
import { useCartStore } from '@/stores/useCartStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { total_items, fetchCart } = useCartStore()

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
      {/* Header con fondo difuminado */}
      <header className="navbar-header sticky top-0 z-50 w-full">
        {/* Fondo con blur */}
        <div className="navbar-backdrop" />
        
        {/* Contenedor principal con padding superior para las islas */}
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          
          {/* VERSIÓN ESCRITORIO - Islands Layout */}
          <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
            
            {/* ISLAND 1: Logo */}
            <div className="navbar-island flex items-center">
              <Link
                href={isAuthenticated ? '/materials' : '/'}
                className="flex-shrink-0 transition-transform hover:scale-105"
              >
                <Image
                  src="/images/LogoFondoBlanco.webp"
                  alt="Waste to Treasure Logo"
                  width={80}
                  height={62}
                  className="h-14 w-auto"
                />
              </Link>
            </div>

            {/* ISLAND 2: Navegación Central */}
            <nav className="navbar-island flex items-center gap-1">
              <Link
                href="/materials"
                className="navbar-navlink group relative px-5 py-2.5 font-inter text-sm font-medium text-neutral-900 transition-all hover:text-primary-500"
              >
                <span className="relative z-10">Materiales</span>
                <div className="absolute inset-0 rounded-lg bg-primary-500/0 transition-all group-hover:bg-primary-500/5" />
              </Link>
              <Link
                href="/products"
                className="navbar-navlink group relative px-5 py-2.5 font-inter text-sm font-medium text-neutral-900 transition-all hover:text-primary-500"
              >
                <span className="relative z-10">Productos</span>
                <div className="absolute inset-0 rounded-lg bg-primary-500/0 transition-all group-hover:bg-primary-500/5" />
              </Link>
              <Link
                href="/plans"
                className="navbar-navlink group relative px-5 py-2.5 font-inter text-sm font-medium text-neutral-900 transition-all hover:text-primary-500"
              >
                <span className="relative z-10">Planes</span>
                <div className="absolute inset-0 rounded-lg bg-primary-500/0 transition-all group-hover:bg-primary-500/5" />
              </Link>
            </nav>

            {/* ISLAND 3: Acciones de Usuario */}
            <div className="navbar-island flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Carrito */}
                  <Link
                    href="/cart"
                    aria-label="Carrito de compras"
                    className="navbar-action-btn group relative"
                  >
                    <ShoppingCart className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-primary-500" />
                    {total_items > 0 && (
                      <span className="navbar-badge">
                        {total_items}
                      </span>
                    )}
                  </Link>

                  {/* Menú de Perfil */}
                  <div className="relative">
                    <button
                      ref={profileToggleRef}
                      onClick={() => setIsProfileOpen(prev => !prev)}
                      className="navbar-action-btn group flex items-center justify-center"
                      aria-label="Abrir menú de usuario"
                    >
                      <UserAvatar
                        imageUrl={user?.profile_image_url}
                        fullName={user?.name}
                        userId={user?.user_id}
                        size="sm"
                        showIcon={true}
                        className="ring-2 ring-transparent transition-all group-hover:ring-primary-500/50"
                      />
                    </button>

                    {/* Menú Desplegable */}
                    {isProfileOpen && (
                      <div
                        ref={profileMenuRef}
                        className="navbar-dropdown-wrapper"
                      >
                        <div className="navbar-dropdown">
                          <div className="navbar-dropdown-header">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              ¡Hola, {user?.name}!
                            </p>
                          </div>
                          <div className="py-1">
                            {userLinks.map(link => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="navbar-dropdown-item group flex items-center px-4 py-2.5 text-sm text-neutral-700 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <link.icon
                                  className="mr-3 h-4 w-4 text-neutral-400 transition-colors group-hover:text-primary-500"
                                  aria-hidden="true"
                                />
                                <span className="font-medium">{link.label}</span>
                              </Link>
                            ))}
                            {adminLinks.map(link => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="navbar-dropdown-item group flex items-center px-4 py-2.5 text-sm text-primary-600 transition-all hover:bg-primary-50 hover:text-primary-700"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <link.icon
                                  className="mr-3 h-4 w-4 text-primary-500"
                                  aria-hidden="true"
                                />
                                <span className="font-semibold">{link.label}</span>
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-neutral-100 py-1">
                            <button
                              onClick={() => {
                                logout()
                                setIsProfileOpen(false)
                              }}
                              className="navbar-dropdown-item group flex w-full items-center px-4 py-2.5 text-left text-sm text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
                            >
                              <LogOut
                                className="mr-3 h-4 w-4"
                                aria-hidden="true"
                              />
                              <span className="font-medium">Cerrar sesión</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Botones para usuarios no autenticados */}
                  <Link
                    href="/login"
                    className="navbar-auth-outline whitespace-nowrap"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="navbar-auth-solid whitespace-nowrap"
                  >
                    Regístrate
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* VERSIÓN MÓVIL */}
          <div className="flex items-center justify-between md:hidden">
            <Link
              href={isAuthenticated ? '/materials' : '/'}
              className="flex-shrink-0"
            >
              <Image
                src="/images/LogoFondoBlanco.webp"
                alt="Waste to Treasure Logo"
                width={80}
                height={62}
                className="h-14 w-auto"
              />
            </Link>

            <div className="flex items-center gap-2">
              <CartIcon isMobile />
              <button
                ref={mobileToggleRef}
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-900 hover:bg-neutral-100"
                aria-label="Abrir menú principal"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
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