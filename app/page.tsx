import LandingHeader from '@/components/landing/LandingHeader'
import LandingHero from '@/components/landing/LandingHero'
import FeatureGrid from '@/components/landing/FeatureGrid'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <LandingHero />
        <FeatureGrid />
      </main>
    </div>
  )
}
