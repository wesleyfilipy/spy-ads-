import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — AdSpy Platform',
  description: 'Choose the perfect plan to spy on winning Facebook ads. Start free, scale as you grow.',
  openGraph: {
    title: 'AdSpy Pricing — From Free to Enterprise',
    description: 'Mine millions of Facebook ads. Plans for every stage of your business.',
  },
};

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for exploring the platform',
    cta: 'Start Free',
    href: '/register',
    popular: false,
    color: 'border-border',
    features: [
      { text: '10 searches per day', included: true },
      { text: '20 saved ads', included: true },
      { text: 'Basic filters', included: true },
      { text: 'CSV export', included: false },
      { text: 'Bulk download', included: false },
      { text: 'Ad alerts', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Basic',
    price: 29,
    period: 'month',
    description: 'For freelancers and small teams',
    cta: 'Start Basic',
    href: '/register?plan=BASIC',
    popular: false,
    color: 'border-border',
    features: [
      { text: '100 searches per day', included: true },
      { text: '500 saved ads', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'CSV export', included: true },
      { text: 'Bulk download', included: false },
      { text: 'Ad alerts', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 79,
    period: 'month',
    description: 'For media buyers and agencies',
    cta: 'Start Pro',
    href: '/register?plan=PRO',
    popular: true,
    color: 'border-primary/50',
    features: [
      { text: '1,000 searches per day', included: true },
      { text: '5,000 saved ads', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'CSV export', included: true },
      { text: 'Bulk download', included: true },
      { text: 'Ad alerts', included: true },
      { text: 'API access', included: false },
      { text: 'Priority support', included: true },
    ],
  },
  {
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For large teams and agencies',
    cta: 'Contact Sales',
    href: '/register?plan=ENTERPRISE',
    popular: false,
    color: 'border-amber-500/30',
    features: [
      { text: 'Unlimited searches', included: true },
      { text: 'Unlimited saved ads', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'CSV export', included: true },
      { text: 'Bulk download', included: true },
      { text: 'Ad alerts', included: true },
      { text: 'Full API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: 'Daily searches', values: ['10', '100', '1,000', 'Unlimited'] },
  { label: 'Saved ads', values: ['20', '500', '5,000', 'Unlimited'] },
  { label: 'Countries', values: ['All', 'All', 'All', 'All'] },
  { label: 'Chrome Extension', values: [true, true, true, true] },
  { label: 'Scale detection', values: [true, true, true, true] },
  { label: 'Duplicate detection', values: [true, true, true, true] },
  { label: 'CSV Export', values: [false, true, true, true] },
  { label: 'Video download', values: [false, false, true, true] },
  { label: 'Bulk download', values: [false, false, true, true] },
  { label: 'Ad alerts', values: [false, false, true, true] },
  { label: 'API access', values: [false, false, false, true] },
  { label: 'Support', values: ['Community', 'Email', 'Priority', 'Dedicated'] },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-xl font-black gradient-text">AdSpy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-semibold transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
            <Zap className="w-3.5 h-3.5" />
            No hidden fees. Cancel anytime.
          </div>
          <h1 className="text-5xl font-black mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Start for free. Upgrade when you&apos;re ready to scale your ads research.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass rounded-2xl p-6 border ${plan.color} ${plan.popular ? 'bg-primary/5 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-6">
                <h2 className="font-bold text-xl mb-1">{plan.name}</h2>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground mb-1.5">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                    : plan.name === 'Enterprise'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-secondary border border-border hover:border-primary/50 text-foreground'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-2xl font-black">Full Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm w-1/3">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.name} className={`py-4 px-4 text-center font-bold text-sm ${p.popular ? 'text-primary' : ''}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={feature.label} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                    <td className="py-3.5 px-6 text-sm font-medium">{feature.label}</td>
                    {feature.values.map((value, j) => (
                      <td key={j} className="py-3.5 px-4 text-center text-sm">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                          )
                        ) : (
                          <span className={j === 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                            {value}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-center mb-10">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. You\'ll keep access until the end of your billing period.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Our Free plan gives you 10 searches per day forever. No credit card required.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. All payments are secure.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes, you can change your plan at any time from your billing dashboard.',
              },
              {
                q: 'How does the Chrome Extension work?',
                a: 'Install the extension, log in, then visit the Facebook Ads Library. The extension automatically collects and syncs ads to your dashboard.',
              },
              {
                q: 'Is this legal?',
                a: 'Yes. We only collect publicly available ad data from the Facebook Ads Library, which Meta makes publicly accessible.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
