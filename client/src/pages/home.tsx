import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import {
  Check, ArrowRight, ChevronDown, DollarSign, TrendingUp, Star,
  Phone, MapPin, Sparkles, Calculator, ShieldCheck,
  AlertTriangle, Users, Building2, Utensils, Car, Scissors, Heart,
  Zap, Clock, X, Gift,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";

// ─── Animated Counter ───────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = "", suffix = "", duration = 2 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    let start: number; let id: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (ref.current) ref.current.textContent = `${prefix}${v.toLocaleString()}${suffix}`;
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [inView, target, prefix, suffix, duration]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. HERO — The 5-Second Hook
// ═══════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Video */}
      <div className="relative w-full">
        <video autoPlay loop muted playsInline preload="auto" src="/videos/hero-bg-v3.mp4?v=20260305" className="w-full h-auto block" aria-label="Hawaii business payment processing" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="pb-12 sm:pb-20 -mt-16 sm:-mt-28 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 mb-4">
                <Gift className="w-3 h-3 mr-1" />
                Our gift to Hawai'i businesses: zero processing fees + free equipment
              </Badge>
            </motion.div>

            <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-4" variants={fadeUp}>
              Stop Paying 3–4%{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">of Every Sale</span>
            </motion.h1>

            <motion.p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed" variants={fadeUp}>
              We want to give your business the gift of keeping 100% of every sale — with a compliant cash discount program, free equipment, and zero fees. Not surcharging. Just savings.
            </motion.p>

            {/* Supporting bullets */}
            <motion.div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-8" variants={fadeUp}>
              {[
                "Free POS terminal",
                "Zero processing fees",
                "Free merchant website",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
              <Button size="lg" className="text-base px-8 py-6 w-full sm:w-auto" asChild>
                <a href="#calculator">
                  <Calculator className="w-4 h-4" />
                  See How Much You're Losing
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-6 py-6 w-full sm:w-auto" asChild>
                <a href="/contact">
                  Talk to Our Team
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. FEE CALCULATOR — Highest Converting Feature
// ═══════════════════════════════════════════════════════════════════════════

function FeeCalculator() {
  const [volume, setVolume] = useState(25000);
  const [rate, setRate] = useState(3.3);
  const monthlyFees = volume * (rate / 100);
  const annualFees = monthlyFees * 12;
  const weeklyFees = annualFees / 52;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-16 sm:py-24 relative" id="calculator">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-red-400 border-red-400/30 bg-red-400/5">
              <Calculator className="w-3 h-3 mr-1" />
              Fee Loss Calculator
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              How much are you <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">throwing away?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Slide the bar. See the number. That's real money leaving your business.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="border-primary/15 overflow-hidden">
              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Inputs */}
                  <div>
                    <div className="mb-6">
                      <label className="text-sm font-medium mb-2 block">Your monthly card sales</label>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-muted-foreground">$</span>
                        <input type="text" inputMode="numeric" value={volume.toLocaleString()} onChange={(e) => { const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0; setVolume(Math.min(Math.max(v, 1000), 500000)); }}
                          className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-lg font-bold outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <input type="range" min="1000" max="200000" step="1000" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                        style={{ background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((volume - 1000) / 199000) * 100}%, hsl(var(--muted)) ${((volume - 1000) / 199000) * 100}%, hsl(var(--muted)) 100%)` }} />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground"><span>$1K</span><span>$100K</span><span>$200K</span></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your current processing rate</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="6" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                          className="w-24 h-10 rounded-md border border-border bg-background px-3 text-lg font-bold outline-none focus:ring-1 focus:ring-primary" />
                        <span className="text-muted-foreground">%</span>
                        <span className="text-xs text-muted-foreground ml-2">(most businesses pay 2.5–4%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="flex flex-col justify-center gap-4">
                    <div className="text-center p-6 rounded-xl bg-red-500/5 border border-red-500/15">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">You're losing every year</div>
                      <div className="text-4xl sm:text-5xl font-extrabold text-red-400">{fmt(annualFees)}</div>
                      <div className="text-sm text-red-400/70 mt-1">That's {fmt(weeklyFees)} every week</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/15">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">With TechSavvy Hawai'i</div>
                      <div className="text-4xl sm:text-5xl font-extrabold text-primary">$0</div>
                      <div className="text-sm text-primary/70 mt-1">You keep {fmt(annualFees)} in your pocket</div>
                    </div>

                    <Button size="lg" className="w-full" asChild>
                      <a href="/statement-review">
                        Get Your Free Savings Report
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Share row */}
                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-center gap-3">
                  <span className="text-xs text-muted-foreground">Share your results:</span>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://techsavvyhawaii.com")}&quote=${encodeURIComponent(`I just found out I'm losing ${fmt(annualFees)}/year to credit card fees! Check yours:`)}`, "_blank", "width=600,height=400")}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just found out my business is losing ${fmt(annualFees)}/year to credit card fees! Check yours free:`)}&url=${encodeURIComponent("https://techsavvyhawaii.com")}`, "_blank", "width=600,height=400")}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
                    title="Share on X"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "How much are you losing?", text: `I just found out I'm losing ${fmt(annualFees)}/year to credit card fees!`, url: "https://techsavvyhawaii.com" });
                      } else {
                        navigator.clipboard.writeText(`I'm losing ${fmt(annualFees)}/year to credit card fees! Check yours: https://techsavvyhawaii.com`);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
                    title="Share"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROBLEM SECTION — Make Them Feel the Pain
// ═══════════════════════════════════════════════════════════════════════════

function ProblemSection() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-12" variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-red-400 border-red-400/30 bg-red-400/5">
              <AlertTriangle className="w-3 h-3 mr-1" />
              The Reality
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              The Hidden Tax on Every Business
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Every time a customer swipes a card, you lose money. Most business owners don't realize how much it adds up.
            </p>
          </motion.div>

          {/* Loss visualization */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12" variants={fadeUp}>
            {[
              { revenue: "$10K", monthly: "$300–$400", annual: "$3,600–$4,800", color: "yellow" },
              { revenue: "$50K", monthly: "$1,500–$2,000", annual: "$18,000–$24,000", color: "orange" },
              { revenue: "$100K", monthly: "$3,000–$4,000", annual: "$36,000–$48,000", color: "red" },
            ].map((tier) => (
              <Card key={tier.revenue} className="border-red-500/15 overflow-hidden">
                <CardContent className="p-5 sm:p-6 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Monthly Revenue</div>
                  <div className="text-2xl font-extrabold text-foreground mb-3">{tier.revenue}</div>
                  <div className="h-px bg-border mb-3" />
                  <div className="text-sm text-muted-foreground mb-1">Lost per month</div>
                  <div className="text-lg font-bold text-red-400 mb-2">{tier.monthly}</div>
                  <div className="text-sm text-muted-foreground mb-1">Lost per year</div>
                  <div className="text-xl font-extrabold text-red-400">{tier.annual}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div className="text-center" variants={fadeUp}>
            <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              That's money you earned — going straight to the credit card companies.
            </p>
            <p className="text-muted-foreground mb-4">
              What if someone handed you a way to keep all of it?
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/equipment">
                <Gift className="w-3.5 h-3.5" />
                See what we're giving you — free
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. WHY WE BUILT TECHSAVVY — The Story
// ═══════════════════════════════════════════════════════════════════════════

function WhySection() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-5">
              Why We Built{" "}
              <span className="text-primary">TechSavvy Hawai'i</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-5">
              Local Hawai'i businesses are losing thousands every year simply for accepting payments. We built TechSavvy Hawai'i to change that — with a fully compliant cash discount program that eliminates processing fees entirely.
            </p>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              We're not a mainland company with a 1-800 number. We're local. When you call, a real person from Hawai'i picks up. When you need help, someone comes to your business — not an email bot.
            </p>
            <div className="space-y-4">
              {[
                { icon: MapPin, text: "Keep local money local" },
                { icon: Heart, text: "Help small businesses survive and thrive" },
                { icon: Zap, text: "Eliminate unnecessary middlemen" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12 text-center">
              <MapPin className="w-14 h-14 text-primary mx-auto mb-4" />
              <div className="text-2xl font-bold text-foreground mb-2">Locally Owned & Operated</div>
              <div className="text-muted-foreground mb-4">Honolulu, O'ahu · Serving all islands</div>
              <p className="text-sm text-muted-foreground mb-6">Our reputation in the community is everything. That's why we never lock you in a contract — we earn your business every single month.</p>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:8087675460">
                  <Phone className="w-4 h-4" />
                  (808) 767-5460
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. HOW IT WORKS — 3 Simple Steps
// ═══════════════════════════════════════════════════════════════════════════

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "We gift you a free terminal",
      desc: "Quick application, fast approval. We give you a free POS terminal or card reader — our gift to your business. Our local team handles installation, signage, and training.",
      icon: Gift,
    },
    {
      num: "2",
      title: "Customers pay normally",
      desc: "Customers can still use all cards — Visa, Mastercard, Amex, Apple Pay. Your posted prices reflect a cash discount, and card users simply pay the standard listed price.",
      icon: Users,
    },
    {
      num: "3",
      title: "You keep every dollar you earn",
      desc: "With our cash discount program, you keep 100% of every sale. No processing fees, no monthly fees, no hidden charges. Funds deposited next business day.",
      icon: DollarSign,
    },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-12" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              How TechSavvy Hawai'i Works
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Three simple steps. No complicated process. No long wait times.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-10">
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeUp}>
                <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">{step.num}</div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div className="text-center" variants={fadeUp}>
            <Button size="lg" asChild>
              <a href="/apply">
                <Gift className="w-4 h-4" />
                Claim Your Free Equipment
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. COMPARISON CHART — Show the Contrast
// ═══════════════════════════════════════════════════════════════════════════

function ComparisonSection() {
  const rows = [
    { feature: "Processing Fees", traditional: "2.6–4%", techsavvy: "$0", highlight: true },
    { feature: "Monthly Fees", traditional: "$14.95–$85+", techsavvy: "$0", highlight: true },
    { feature: "Website Included", traditional: "No", techsavvy: "Yes — Free", highlight: false },
    { feature: "Local Support", traditional: "Rare / Call Center", techsavvy: "Yes — Hawai'i Team", highlight: true },
    { feature: "Contract Lock-in", traditional: "Often 3+ years", techsavvy: "Never", highlight: false },
    { feature: "Equipment Cost", traditional: "$300–$800+", techsavvy: "Free — Our Gift", highlight: true },
    { feature: "Next-Day Funding", traditional: "Sometimes", techsavvy: "Yes", highlight: false },
  ];

  return (
    <section className="py-16 sm:py-24 relative bg-foreground text-background">
      {/* Wave top */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-8 sm:h-12">
          <path d="M0,60 C300,10 600,50 900,20 C1050,5 1150,30 1200,15 L1200,0 L0,0 Z" fill="hsl(var(--background))" />
        </svg>
      </div>
      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-8 sm:h-12">
          <path d="M0,60 C300,10 600,50 900,20 C1050,5 1150,30 1200,15 L1200,0 L0,0 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-background">
              See the Difference
            </h2>
            <p className="text-background/60 max-w-lg mx-auto">
              Side by side, the choice becomes obvious.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden border-background/20 bg-background/10 backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-background/10">
                      <th className="text-left p-4 font-semibold text-background/60 w-[36%]">Feature</th>
                      <th className="text-center p-4 w-[32%] text-background/60 font-semibold">Traditional Processor</th>
                      <th className="text-center p-4 w-[32%] bg-primary/20 rounded-t-lg">
                        <span className="font-bold text-primary">TechSavvy Hawai'i</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.feature} className={`border-b border-background/10 ${i % 2 ? "bg-background/5" : ""}`}>
                        <td className="p-3 sm:p-4 font-medium text-background/70">{r.feature}</td>
                        <td className="p-3 sm:p-4 text-center text-red-300/80">
                          <span className="inline-flex items-center gap-1">
                            {r.feature !== "Next-Day Funding" && r.feature !== "Contract Lock-in" && <X className="w-3.5 h-3.5 text-red-400/60" />}
                            {r.traditional}
                          </span>
                        </td>
                        <td className={`p-3 sm:p-4 text-center bg-primary/20 ${r.highlight ? "text-primary font-bold text-base sm:text-lg" : "text-primary font-semibold"}`}>
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {r.techsavvy}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 text-[10px] text-background/40 border-t border-background/10">
                *Free terminal for businesses processing $5K+/month
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. CASE STUDIES — Show Real Numbers
// ═══════════════════════════════════════════════════════════════════════════

function CaseStudies() {
  const cases = [
    {
      type: "Restaurant",
      location: "Honolulu",
      icon: Utensils,
      monthly: 40000,
      oldFees: 1200,
      annualSavings: 14400,
    },
    {
      type: "Auto Repair Shop",
      location: "Pearl City",
      icon: Car,
      monthly: 55000,
      oldFees: 1650,
      annualSavings: 19800,
    },
    {
      type: "Nail Salon",
      location: "Kailua",
      icon: Scissors,
      monthly: 18000,
      oldFees: 594,
      annualSavings: 7128,
    },
  ];

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-12" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Real Businesses. Real Savings.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Nothing persuades like real numbers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {cases.map((c) => (
              <motion.div key={c.type} variants={fadeUp}>
                <Card className="h-full border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-5 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <c.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{c.type}</div>
                          <div className="text-xs text-muted-foreground">{c.location}, Hawai'i</div>
                        </div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly revenue</span>
                        <span className="font-semibold">{fmt(c.monthly)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Old processor fees</span>
                        <span className="font-semibold text-red-400">-{fmt(c.oldFees)}/mo</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Now pays</span>
                        <span className="font-bold text-primary text-lg">$0</span>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/15">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Savings</div>
                        <div className="text-2xl font-extrabold text-primary">{fmt(c.annualSavings)}</div>
                      </div>
                    </div>
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

// ═══════════════════════════════════════════════════════════════════════════
// 8. TESTIMONIALS — Social Proof
// ═══════════════════════════════════════════════════════════════════════════

function TestimonialSection() {
  const testimonials = [
    { name: "Restaurant Owner", loc: "Waikiki", quote: "We were losing over $1,200 a month and didn't even know it. TechSavvy showed us the numbers and switched us over in a week. Best business decision we made this year.", savings: "$14,400/yr saved" },
    { name: "Nail Salon Owner", loc: "Kailua", quote: "Switching was so easy. TechSavvy's local team set everything up and we got a new terminal for free. The savings are real — we see it every month.", savings: "$7,100/yr saved" },
    { name: "Aloha Light Center", loc: "Honolulu", quote: "TechSavvy made the whole process seamless. No more processing fees eating into our revenue every month. Their local team is always a phone call away.", savings: "$18,000/yr saved" },
    { name: "Spa Owner", loc: "Waikiki", quote: "Great rates, great service, and the equipment was free. I tell every business owner I know about TechSavvy.", savings: "$9,600/yr saved" },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Hawai'i business owners who stopped losing money
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border/50 card-warm">
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">
                        {t.savings}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-4">"{t.quote}"</p>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.loc}</div>
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

// ═══════════════════════════════════════════════════════════════════════════
// 9. FAQ — Handle Objections
// ═══════════════════════════════════════════════════════════════════════════

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What is a cash discount program?", a: "A cash discount program lets you offer a discount to customers who pay with cash, while customers who pay by card pay the standard listed price. Unlike surcharging, which adds a fee on top, cash discounting sets your posted price as the card price and rewards cash payers with a lower price. It's the same model gas stations have used for years — and it's fully legal in all 50 states." },
    { q: "Is cash discounting legal?", a: "Yes — 100% legal in Hawai'i and all 50 states. Cash discount programs are explicitly permitted by Visa, Mastercard, and the FTC. They are not surcharges. We handle all the compliance, signage, and receipt formatting so you stay compliant from day one." },
    { q: "How is this different from surcharging?", a: "Surcharging adds a fee on top of the listed price for card users — and it's restricted or banned in some states. Cash discounting is different: your posted price is the standard price, and cash customers receive a discount. It's simpler, legal everywhere, and customers respond to it more positively because they see a discount rather than a penalty." },
    { q: "Will my customers complain?", a: "The vast majority don't. With cash discounting, customers see 'cash discount applied' on their receipt when paying cash — it feels like a reward, not a penalty. Card-paying customers simply pay the listed price they already expected. Most businesses report zero pushback after the first week." },
    { q: "Can I keep my current POS?", a: "In many cases, yes. Our cash discount program works with most major POS systems. If an upgrade is needed, we provide free equipment for qualifying businesses — pre-configured for compliant cash discount processing." },
    { q: "How fast is the setup?", a: "Most businesses are up and running in 3–7 days. Our local Hawai'i team handles everything — terminal programming for cash discount, compliant signage, receipt configuration, and staff training." },
    { q: "What equipment is needed?", a: "We provide a free terminal for businesses processing $5K+ per month. It's pre-programmed for cash discount compliance and accepts all cards, tap-to-pay, Apple Pay, Google Pay — everything your customers use." },
    { q: "What if I don't like it?", a: "No contract. No cancellation fee. If cash discounting isn't working for your business, you can leave anytime with zero penalty. We keep businesses by saving them money, not by trapping them." },
    { q: "How much will I actually save?", a: "That depends on your volume, but most Hawai'i businesses save $500–$3,000+ per month with our cash discount program. Use our calculator above or get a free statement analysis — no commitment required." },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Questions you're probably thinking
            </h2>
          </motion.div>
          <motion.div className="space-y-3" variants={fadeUp}>
            {faqs.map((faq, i) => (
              <Card key={i} className="border-border/50 overflow-hidden cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
                <CardContent className="p-0">
                  <button className="w-full p-5 flex items-center justify-between text-left">
                    <span className="font-bold text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                  </button>
                  {open === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. FINAL CTA — Conversion Point
// ═══════════════════════════════════════════════════════════════════════════

function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5">
            We Want to{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Give You This</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Free equipment. Zero processing fees. No contracts. Our gift to your business — because Hawai'i businesses deserve to keep every dollar they earn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="text-base px-8 py-6 w-full sm:w-auto" asChild>
              <a href="/apply">
                <Gift className="w-4 h-4" />
                Claim Your Free Setup
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 py-6 w-full sm:w-auto" asChild>
              <a href="/equipment">
                Browse Free Equipment
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />PCI DSS Compliant</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />No Contracts</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />BBB Accredited</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />Honolulu, HI</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUST BADGES
// ═══════════════════════════════════════════════════════════════════════════

function LocalTrustBadges() {
  return (
    <section className="py-10 sm:py-14 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Trusted by Hawai'i businesses · Compliant with all major card networks</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60">
            {[
              { name: "Visa", svg: <svg className="h-8 sm:h-10" viewBox="0 0 100 32" fill="none"><text x="5" y="25" fontFamily="var(--font-heading)" fontWeight="800" fontSize="28" fill="currentColor">VISA</text></svg> },
              { name: "Mastercard", svg: <svg className="h-8 sm:h-10" viewBox="0 0 140 32"><circle cx="52" cy="16" r="14" fill="#EB001B" opacity="0.7"/><circle cx="82" cy="16" r="14" fill="#F79E1B" opacity="0.7"/></svg> },
              { name: "Amex", svg: <svg className="h-8 sm:h-10" viewBox="0 0 100 32"><text x="5" y="24" fontFamily="var(--font-heading)" fontWeight="800" fontSize="22" fill="currentColor">AMEX</text></svg> },
              { name: "Discover", svg: <svg className="h-8 sm:h-10" viewBox="0 0 130 32"><text x="5" y="24" fontFamily="var(--font-heading)" fontWeight="700" fontSize="22" fill="currentColor">Discover</text></svg> },
              { name: "Apple Pay", svg: <svg className="h-8 sm:h-10" viewBox="0 0 120 32"><text x="5" y="24" fontFamily="var(--font-heading)" fontWeight="600" fontSize="20" fill="currentColor"> Pay</text></svg> },
              { name: "Google Pay", svg: <svg className="h-8 sm:h-10" viewBox="0 0 130 32"><text x="5" y="24" fontFamily="var(--font-heading)" fontWeight="600" fontSize="20" fill="currentColor">G Pay</text></svg> },
            ].map((brand) => (
              <div key={brand.name} className="flex items-center text-muted-foreground" title={brand.name}>
                {brand.svg}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE EXPORT — The Conversion Funnel
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  useSEO({
    title: "Zero-Fee Credit Card Processing Hawaii | Stop Paying 3-4% | TechSavvy Hawai'i",
    description: "Eliminate credit card processing fees for your Hawai'i business with our cash discount program. Save $6,000–$36,000/year on card processing. Free POS terminal, no contracts, local support. Payment processing & merchant services for all Hawaiian Islands.",
    keywords: "credit card processing Hawaii, payment processing Hawaii, card processing Hawaii, credit card fees Hawaii, zero fee credit card processing, cash discount program Hawaii, eliminate credit card fees Honolulu, merchant services Oahu, payment processor Hawaii, credit card machine Hawaii, POS terminal Hawaii, no contract card processing, free credit card terminal Hawaii, accept credit cards Hawaii, best payment processor Hawaii, cheapest credit card processing Hawaii, small business credit card processing Hawaii, TechSavvy Hawaii",
    canonical: "https://techsavvyhawaii.com/",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      {/* 1. Hero — The 5-Second Hook */}
      <HeroSection />
      {/* 2. Fee Calculator — Highest Converting Feature */}
      <FeeCalculator />
      {/* 3. The Hidden Cost of Card Payments */}
      <ProblemSection />
      {/* 4. Why We Built TechSavvy Hawai'i */}
      <WhySection />
      {/* 5. How It Works — 3 Steps */}
      <HowItWorks />
      {/* 6. Comparison Chart */}
      <ComparisonSection />
      {/* 7. Case Studies — Real Numbers */}
      <CaseStudies />
      {/* 8. Testimonials */}
      <TestimonialSection />
      {/* Trust Badges */}
      <LocalTrustBadges />
      {/* 9. FAQ — Handle Objections */}
      <FAQSection />
      {/* 10. Final CTA */}
      <FinalCTA />
    </Layout>
  );
}
