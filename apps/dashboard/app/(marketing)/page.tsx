import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import SdkExample from '@/components/marketing/SdkExample'
import StatsDifferentiator from '@/components/marketing/StatsDifferentiator'
import Pricing from '@/components/marketing/Pricing'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Absolutely Butter — honest A/B testing for small traffic',
  description:
    'Statistical decision-making for products without enterprise traffic. Thompson sampling gives you an honest probability from the visitors you actually have. $19/month, 30-day free trial.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Absolutely Butter — honest A/B testing for small traffic',
    description:
      'An honest probability that one variant is better, from the traffic you actually have. $19/month, 30-day free trial, no credit card.',
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
