// Autor: Gabriel Florentino Reyes
// Fecha: 14-11-2025
// Descripción: Descripción: Vista About Us del frontend
//              Presenta misión visión valores y estadísticas
//              Muestra historia del proyecto y equipo de trabajo
//              Incluye secciones informativas y llamados a la acción

'use client'

import Link from 'next/link'
import { 
  Recycle, 
  Users, 
  Target, 
  Heart, 
  Leaf,
  Globe,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react'
import Navbar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import ValueCard from '@/components/homepage/ValueCard'
import StatItem from '@/components/homepage/StatItem'
import TeamMember from '@/components/homepage/TeamMember'

export default function AboutPage() {
  const stats = [
    { number: '10K+', label: 'Usuarios Activos' },
    { number: '50K+', label: 'Materiales Reciclados' },
    { number: '100+', label: 'Toneladas Desviadas' },
    { number: '98%', label: 'Satisfacción' },
  ]

  const values = [
    {
      icon: Target,
      title: 'Nuestra Misión',
      description: 'Facilitar la transición hacia una economía circular, conectando a quienes tienen materiales reciclables con quienes pueden darles nueva vida.',
    },
    {
      icon: Globe,
      title: 'Nuestra Visión',
      description: 'Ser la plataforma líder en Latinoamérica para el comercio de materiales reciclables, donde cada recurso encuentre su máximo potencial.',
    },
    {
      icon: Heart,
      title: 'Nuestros Valores',
      description: 'Sostenibilidad, transparencia, comunidad e innovación. Creemos que los negocios pueden ser rentables mientras cuidan del planeta.',
    },
  ]

  const team = [
    { name: 'Arturo Perez', role: 'CEO & Fundadora' },
    { name: 'Oscar Nava', role: 'CTO' },
    { name: 'Alejandro Campa', role: 'Head of Operations' },
    { name: 'Gabriel Florentino', role: 'Lead Developer' },
  ]

  const features = [
    { icon: Recycle, title: '100% Sostenible', description: 'Cada transacción reduce la huella ambiental', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Users, title: 'Comunidad Activa', description: 'Miles de usuarios comprometidos', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: TrendingUp, title: 'Precios Justos', description: 'Comisiones bajas, ganancias para ti', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Award, title: 'Calidad Verificada', description: 'Materiales revisados y aprobados', bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
  ]

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#396539] to-[#294730] text-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                  <Recycle className="w-5 h-5" />
                  <span className="font-inter text-sm">Economía Circular</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins leading-tight">
                  Transformando Residuos en{' '}
                  <span className="text-green-300">Tesoros</span>
                </h1>
                <p className="text-lg text-white/90 mb-8 font-inter leading-relaxed">
                  Waste to Treasure es más que un marketplace. Somos una comunidad comprometida 
                  con darle una segunda vida a los materiales y construir un futuro más sostenible.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors font-inter"
                  >
                    Únete a nosotros
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/materials"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors font-inter"
                  >
                    Explorar materiales
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-80 h-80 bg-white/10 rounded-full mx-auto flex items-center justify-center">
                    <Leaf className="w-40 h-40 text-green-300 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-[#294730] py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <StatItem key={stat.label} number={stat.number} label={stat.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Nuestra Historia */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 font-poppins">
                Nuestra Historia
              </h2>
              <div className="w-20 h-1 bg-primary-500 mx-auto"></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <div className="prose prose-lg max-w-none font-inter text-gray-700">
                <p className="text-lg leading-relaxed mb-6">
                  Waste to Treasure nació en 2025 de una idea simple pero poderosa: 
                  <strong className="text-primary-600"> ¿y si lo que para unos es basura, para otros es el recurso perfecto?</strong>
                </p>
                <p className="leading-relaxed mb-6">
                  Fundada por un grupo de emprendedores apasionados por la sostenibilidad, nuestra plataforma 
                  conecta a empresas, artesanos y personas que generan materiales reciclables con aquellos 
                  que pueden transformarlos en productos valiosos.
                </p>
                <div className="bg-green-50 border-l-4 border-primary-500 p-6 rounded-r-lg">
                  <p className="text-primary-800 italic font-medium">
                    "No creemos en la basura, creemos en recursos mal ubicados. Nuestro trabajo es 
                    conectar cada material con su propósito correcto."
                  </p>
                  <p className="text-primary-600 mt-2 font-semibold">
                    — Equipo Fundador de W2T
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Misión, Visión, Valores */}
        <div className="bg-gray-100 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 font-poppins">
                Lo Que Nos Mueve
              </h2>
              <div className="w-20 h-1 bg-primary-500 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value) => (
                <ValueCard
                  key={value.title}
                  icon={value.icon}
                  title={value.title}
                  description={value.description}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Por qué elegirnos */}
        <div className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 font-poppins">
                ¿Por Qué Waste to Treasure?
              </h2>
              <div className="w-20 h-1 bg-primary-500 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="bg-white rounded-xl shadow-lg p-6 text-center hover:transform hover:-translate-y-2 transition-all">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <h4 className="font-bold text-neutral-900 mb-2 font-poppins">{feature.title}</h4>
                  <p className="text-gray-600 text-sm font-inter">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipo */}
        <div className="bg-gray-100 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 font-poppins">
                Nuestro Equipo
              </h2>
              <p className="text-gray-600 font-inter max-w-2xl mx-auto">
                Un grupo diverso de profesionales unidos por la pasión de crear un mundo más sostenible.
              </p>
              <div className="w-20 h-1 bg-primary-500 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {team.map((member) => (
                <TeamMember key={member.name} name={member.name} role={member.role} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-primary-500 to-green-500 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-poppins">
              ¿Listo para ser parte del cambio?
            </h2>
            <p className="text-white/90 text-lg mb-8 font-inter max-w-2xl mx-auto">
              Únete a miles de personas que ya están transformando residuos en oportunidades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-100 transition-colors font-inter text-lg"
              >
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/materials"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors font-inter text-lg"
              >
                Explorar marketplace
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}