import { AnnouncementBar } from '@/components/landing/AnnouncementBar'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/hero/Hero'
import { ProviderMarquee } from '@/components/sections/ProviderMarquee'
import { CostComparison } from '@/components/sections/CostComparison'
import { FeatureRail } from '@/components/sections/FeatureRail'
import { CodeTabs } from '@/components/sections/CodeTabs'
import { BentoGrid } from '@/components/sections/BentoGrid'
import { Architecture } from '@/components/sections/Architecture'
import { Limitations } from '@/components/sections/Limitations'
import { FAQSection } from '@/components/sections/FAQSection'
import { FinalCTA, Footer } from '@/components/sections/FooterCTA'

export default function HomePage() {
  return (
    <div className="zyra-landing min-h-screen bg-bg text-text">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <div id="providers">
          <ProviderMarquee />
        </div>
        <CostComparison />
        <div id="capabilities">
          <FeatureRail />
        </div>
        <CodeTabs />
        <BentoGrid />
        <Architecture />
        <Limitations />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
