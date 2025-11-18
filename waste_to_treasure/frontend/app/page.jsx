/**
 * Autor: Oscar Alonso Nava Rivera, AlejandroCampa-215833
 * Fecha: 08/11/2025
 * Componente: HomePage
 * Descripción: Página principal (homepage) con secciones destacadas.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'
import Hero from '@/components/homepage/Hero'
import HowItWorks from '@/components/homepage/HowItWorks'
import FeaturedProducts from '@/components/homepage/FeaturedProducts'
import FeaturedMaterials from '@/components/homepage/FeaturedMaterials'
import Cta from '@/components/homepage/Cta'
import Footer from '@/components/layout/Footer'
import NavBar from '@/components/layout/NavBar'
import { listingsService } from '@/lib/api/listings';

export default function HomePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const [productsRes, materialsRes] = await Promise.all([
          listingsService.getAll({ listing_type: 'PRODUCT', page_size: 6 }),
          listingsService.getAll({ listing_type: 'MATERIAL', page_size: 6 })
        ]);
        setProducts(productsRes.items || []);
        setMaterials(materialsRes.items || []);
      } catch (err) {
        setError('No se pudieron cargar los datos destacados. Por favor, intente más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // Show loading state
  if (authLoading || loading) {
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
        <Hero items={[...products, ...materials]} />
        <HowItWorks />
        {products.length > 0 && <FeaturedProducts products={products} />}
        {materials.length > 0 && <FeaturedMaterials materials={materials} />}
        <Cta />
      </main>
      <Footer />
    </div>
  )
}