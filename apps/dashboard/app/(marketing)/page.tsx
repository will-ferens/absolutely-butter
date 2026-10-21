import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import SdkExample from '@/components/marketing/SdkExample'
import StatsDifferentiator from '@/components/marketing/StatsDifferentiator'
import Pricing from '@/components/marketing/Pricing'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Absolutely Butter - product decisions from the traffic you have',
  description:
    'Make data driven decisions before you have millions of visitors. Absolutely Butter helps growing products learn from the traffic they have today. $19/month, 30-day free trial.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Absolutely Butter — product decisions from the traffic you have',
    description:
    'Make data driven decisions before you have millions of visitors. Absolutely Butter helps growing products learn from the traffic they have today. $19/month, 30-day free trial.',
  },
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SdkExample />
      <StatsDifferentiator />
      <Pricing />
    </>
  )
}
