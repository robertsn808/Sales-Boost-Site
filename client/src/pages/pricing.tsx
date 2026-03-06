import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, DollarSign, ShieldCheck, MapPin,
  Phone, Truck, RotateCcw, Gift, Clock, ChevronDown, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";

export default function PricingPage() {
  useSEO({
    title: "Credit Card Processing Pricing | Zero Fees | TechSavvy Hawaii",
    description: "TechSavvy Hawaii: $0 processing fees, $0 monthly fees, no contracts. Free equipment for qualifying businesses. Cash discount program saves Hawaii businesses $6,000–$36,000/year.",
    keywords: "credit card processing pricing Hawaii, payment processing cost, cash discount program pricing, zero fee card processing cost, free POS terminal Hawaii, no contract credit card processing, merchant services pricing Hawaii, card processing rates Hawaii",
    canonical: "https://techsavvyhawaii.com/pricing",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "TechSavvy Hawaii — Zero-Fee Payment Processing",
      "url": "https://techsavvyhawaii.com/pricing",
      "description": "$0 processing fees, $0 monthly fees, no contracts. Free equipment for qualifying businesses.",
      "isPartOf": { "@id": "https://techsavvyhawaii.com/#website" },
      "about": { "@id": "https://techsavvyhawaii.com/#payment-service" },
    },
  });

  return (
    <Layout>
      <PricingHero />
      <HowItWorks />
      <WhatYouGet />
      <ComparisonSection />
      <ZeroRiskSection />
      <FinalCTA />
    </Layout>
  );
}

function PricingHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-36 sm:pb-14">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
      </div>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <DollarSign className="w-3 h-3 mr-1" />
              Simple, Honest Pricing
            </Badge>
          </motion.div>
          <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5" variants={fadeUp}>
            <span className="text-primary">$0</span> Processing Fees.{" "}
            <span className="text-primary">$0</span> Monthly Fees.
          </motion.h1>
          <motion.p className="text-sm sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto" variants={fadeUp}>
            No hidden costs. No rate hikes. No contracts. Just a simple cash discount program that puts your processing fees back where they belong — in your pocket.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
            <Button size="lg" className="px-8" asChild>
              <a href="/statement-review">
                Free AI Statement Analysis
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:8087675460">
                <Phone className="w-4 h-4" />
                (808) 767-5460
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "1", title: "Apply online", desc: "Takes about 3 minutes. We review your business info and processing volume." },
    { num: "2", title: "Get approved", desc: "Usually within 24 hours. We confirm your savings and set a setup date." },
    { num: "3", title: "We set up everything", desc: "Free terminal, signage, and staff training. You don't lift a finger." },
    { num: "4", title: "Start saving", desc: "Accept payments with $0 processing fees from day one." },
  ];

  return (
    <section className="py-14 sm:py-24">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">Getting started is simple.</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <motion.div key={s.num} variants={fadeUp}>
                <Card className="h-full border-primary/10 card-warm">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-lg font-extrabold text-primary">{s.num}</span>
                    </div>
                    <h3 className="font-bold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WhatYouGet() {
  return (
    <section className="py-14 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">Everything included. <span className="text-primary">No add-ons.</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Other processors nickel-and-dime you. We give you everything upfront.</p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="border-primary/20">
              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                  {[
                    "Zero processing fees — forever",
                    "Zero monthly fees — forever",
                    "No contracts or cancellation fees",
                    "Free terminal for qualifying businesses",
                    "Full setup, programming & training",
                    "Compliance signage kit included",
                    "Next-day funding",
                    "Accept all cards: chip, tap, swipe",
                    "Local Hawai'i-based support team",
                    "Apple Pay & Google Pay accepted",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your ongoing cost with TechSavvy</div>
                    <div className="text-4xl font-extrabold text-primary">$0<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  </div>
                  <Button size="lg" asChild>
                    <a href="/statement-review">
                      See Your Savings
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const [open, setOpen] = useState<number | null>(null);
  const fees = [
    { label: "Processing fees", typical: "$600–$3,000/mo", ts: "$0", note: "Biggest savings — you keep 100%" },
    { label: "Monthly/statement fees", typical: "$15–$85/mo", ts: "$0", note: null },
    { label: "PCI compliance fee", typical: "$10–$25/mo", ts: "$0", note: null },
    { label: "Gateway/batch fee", typical: "$10–$30/mo", ts: "$0", note: null },
    { label: "Contract length", typical: "2–3 years", ts: "None", note: "Cancel anytime, zero penalty" },
    { label: "Cancellation fee", typical: "$300–$500", ts: "$0", note: null },
    { label: "Equipment", typical: "$30–$80/mo lease", ts: "Free*", note: "Free for $10K+/mo volume" },
  ];

  return (
    <section className="py-14 sm:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-center">What you're paying now vs. TechSavvy</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">Here's where all those "small" fees add up.</p>
          <Card className="overflow-hidden border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Fee</th>
                    <th className="text-center p-4 font-semibold text-red-400">Typical Processor</th>
                    <th className="text-center p-4 font-bold text-primary bg-primary/5">TechSavvy</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f, i) => (
                    <tr key={f.label} className={`border-b border-border/30 ${i % 2 ? "bg-muted/10" : ""}`}>
                      <td className="p-3 sm:p-4">
                        <span className="font-medium text-foreground/80">{f.label}</span>
                        {f.note && <div className="text-[10px] text-muted-foreground mt-0.5">{f.note}</div>}
                      </td>
                      <td className="p-3 sm:p-4 text-center text-red-400">{f.typical}</td>
                      <td className="p-3 sm:p-4 text-center text-primary font-bold bg-primary/5">{f.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function ZeroRiskSection() {
  const guarantees = [
    { icon: Truck, title: "Free equipment delivery", desc: "We ship the terminal to your business — fully programmed and ready to go." },
    { icon: RotateCcw, title: "No contracts ever", desc: "Leave anytime with zero cancellation fee. We earn your business every month." },
    { icon: ShieldCheck, title: "Fully compliant", desc: "100% legal in all 50 states. Visa, Mastercard, and FTC approved. We handle all signage." },
    { icon: Gift, title: "Free savings analysis", desc: "Upload your statement and our AI shows you exactly what you're losing — no obligation." },
  ];

  return (
    <section className="py-14 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">Zero risk. <span className="text-primary">Zero catch.</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guarantees.map((g) => (
              <motion.div key={g.title} variants={fadeUp}>
                <Card className="h-full border-primary/10 card-warm">
                  <CardContent className="p-5 sm:p-7">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <g.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{g.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-14 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
            <CardContent className="p-8 sm:p-12 relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Every month you wait is money lost.</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                The average Hawaii business loses $500–$3,000+ per month to processing fees. Find out your number — free, no obligation.
              </p>
              <Button size="lg" className="px-8" asChild>
                <a href="/statement-review">
                  Get Your Free AI Analysis
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                1917 S King St, Honolulu · (808) 767-5460 · Mahalo 🤙
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
