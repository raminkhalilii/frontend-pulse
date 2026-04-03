import Navbar from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { ArchitectureFeatures } from '@/components/sections/ArchitectureFeatures'
import { CTA } from '@/components/sections/CTA'

export default function LandingPage() {
  return (
    <main className="w-full bg-[#0A0F1A] text-white">
      <Navbar />
      <Hero />
      <ArchitectureFeatures />
      <CTA />
      <Footer />
    </main>
  )
}
