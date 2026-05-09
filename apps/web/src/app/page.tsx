'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Search, Zap, Shield, TrendingUp, Globe, Eye } from 'lucide-react';

const FEATURES = [
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Advanced Search',
    desc: 'Filter by country, language, niche, CTA, domain and more. Find exactly what you need.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Real-time Mining',
    desc: 'Our Chrome extension mines Facebook Ads Library automatically in real-time.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Scale Detection',
    desc: 'Detect scaled campaigns and identify winning creatives before your competitors.',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Duplicate Detection',
    desc: 'Visual pHash algorithm groups similar ads to reveal duplicate campaigns.',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Multi-country',
    desc: 'Track ads across US, BR, UK, CA, AU and 10+ countries simultaneously.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure & Private',
    desc: 'Enterprise-grade security with JWT auth and end-to-end encrypted storage.',
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: '$29',
    period: '/month',
    features: ['100 searches/day', '500 saved ads', 'CSV export', 'Advanced filters'],
    cta: 'Start Basic',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/month',
    features: ['1000 searches/day', '5000 saved ads', 'Bulk download', 'Ad alerts', 'Priority support'],
    cta: 'Start Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: ['Unlimited searches', 'Unlimited saved ads', 'API access', 'White-label', 'Dedicated support'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black gradient-text">AdSpy</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
              BETA
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full mb-8 font-medium">
              <Zap className="w-3.5 h-3.5" />
              Real-time Facebook Ads Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              Spy on{' '}
              <span className="gradient-text">Winning Ads</span>
              <br />
              Before Everyone Else
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Mine millions of Facebook ads, detect scaled campaigns, find viral creatives, and reverse-engineer
              your competitors' funnels — all in one powerful dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-secondary border border-border hover:border-primary/50 text-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all"
              >
                View Demo
              </Link>
            </div>

            <p className="text-muted-foreground text-sm mt-6">
              No credit card required · 10 free searches/day forever
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10M+', label: 'Ads Indexed' },
            { value: '50+', label: 'Countries' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<1s', label: 'Search Speed' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-black gradient-text">{stat.value}</div>
              <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Dominate Ads</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional ad intelligence tools used by top media buyers and marketing agencies worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground text-lg">Start free. Scale when ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'gradient-border bg-primary/5'
                    : 'glass'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground mb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                      : 'bg-secondary border border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to{' '}
            <span className="gradient-text">Find Winning Ads?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join thousands of media buyers using AdSpy to discover profitable ad campaigns.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black gradient-text">AdSpy</span>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} AdSpy Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
