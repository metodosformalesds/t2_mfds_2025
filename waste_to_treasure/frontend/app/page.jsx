'use client';

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Hero from '@/components/homepage/Hero'
import HowItWorks from '@/components/homepage/HowItWorks'
import FeaturedProducts from '@/components/homepage/FeaturedProducts'
import FeaturedMaterials from '@/components/homepage/FeaturedMaterials'
import Cta from '@/components/homepage/Cta'
import Footer from '@/components/layout/Footer'
import NavBar from '@/components/layout/NavBar'

// Datos de ejemplo para los carruseles, se modificara despues con elementos de nuestra bd
const mockProducts = [
  {
    id: 1,
    title: 'Lámpara colgante de cobre',
    category: 'Hogar y decoración',
    rating: 5.0,
    reviews: 15,
    price: 950.0,
    imageUrl: 'https://okdiario.com/img/2020/10/09/5-secretos-de-los-gatos-que-seguramente-no-conoces.jpg',
  },
  {
    id: 2,
    title: 'Bolsa de lona reciclada',
    category: 'Accesorios',
    rating: 4.8,
    reviews: 22,
    price: 450.0,
    imageUrl: 'https://mmedia.notitarde.com.ve/19502/agencia-26108.jpg',
  },
  {
    id: 3,
    title: 'Mesa de centro (Tarima)',
    category: 'Muebles',
    rating: 4.9,
    reviews: 8,
    price: 1200.0,
    imageUrl: 'https://irisveterinaria.com.br/wp-content/uploads/2022/09/Como-e-a-visao-de-um-gato-Confira-5-curiosidades-aqui.jpg',
  },
  {
    id: 4,
    title: 'Cartera de cuero',
    category: 'Accesorios',
    rating: 5.0,
    reviews: 30,
    price: 600.0,
    imageUrl: 'https://mininos.es/wp-content/uploads/2024/03/cuidados-para-gatos.jpg',
  },
  {
    id: 5,
    title: 'Juego de vasos (Vidrio)',
    category: 'Hogar y decoración',
    rating: 4.7,
    reviews: 12,
    price: 350.0,
    imageUrl: 'https://michigato.com/wp-content/uploads/2022/06/razas-de-gatos-naranjas.jpg',
  },
  {
    id: 5,
    title: 'Juego de vasos (Vidrio)',
    category: 'Hogar y decoración',
    rating: 4.7,
    reviews: 12,
    price: 350.0,
    imageUrl: 'https://irisveterinaria.com.br/wp-content/uploads/2022/09/Como-e-a-visao-de-um-gato-Confira-5-curiosidades-aqui.jpg',
  },
]

const mockMaterials = [
  {
    id: 1,
    title: 'Plástico triturado PET',
    seller: 'Maquiladora X',
    price: 15.0,
    unit: 'KG',
    available: 1,
    unit_measure: 'Tonelada',
    isResidue: true,
    imageUrl: 'https://th.bing.com/th/id/R.7bb37e8a014b68ab774be2620c16ccae?rik=8FDwJuvB2NO0Vg&pid=ImgRaw&r=0',
  },
  {
    id: 2,
    title: 'Retazos de mezclilla',
    seller: 'Fábrica de Ropa Y',
    price: 5.0,
    unit: 'KG',
    available: 500,
    unit_measure: 'KG',
    isResidue: false,
    imageUrl: 'https://www.xlsemanal.com/wp-content/uploads/sites/3/2018/10/plasticos-toxicos.jpg',
  },
  {
    id: 3,
    title: 'Tarimas de madera',
    seller: 'Centro Logístico Z',
    price: 50.0,
    unit: 'pza',
    available: 100,
    unit_measure: 'unidades',
    isResidue: false,
    imageUrl: 'https://www.xlsemanal.com/wp-content/uploads/sites/3/2018/10/plasticos-toxicos.jpg',
  },
  {
    id: 4,
    title: 'Cobre (cableado)',
    seller: 'Planta Eléctrica A',
    price: 120.0,
    unit: 'KG',
    available: 200,
    unit_measure: 'KG',
    isResidue: true,
    imageUrl: 'https://www.xlsemanal.com/wp-content/uploads/sites/3/2018/10/plasticos-toxicos.jpg',
  },
  {
    id: 5,
    title: 'Cartón compactado',
    seller: 'Retail B',
    price: 2.0,
    unit: 'KG',
    available: 2,
    unit_measure: 'Toneladas',
    isResidue: true,
    imageUrl: 'https://www.xlsemanal.com/wp-content/uploads/sites/3/2018/10/plasticos-toxicos.jpg',
  },
]

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#396539] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />
      <main>
        {/* Show welcome message for authenticated users */}
        {isAuthenticated && user && (
          <div className="bg-[#396539] text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm">
                Bienvenido de nuevo, <span className="font-semibold">{user.name || user.email}</span>! 
              </p>
            </div>
          </div>
        )}
        
        <Hero />
        <HowItWorks />
        <FeaturedProducts products={mockProducts} />
        <FeaturedMaterials materials={mockMaterials} />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}