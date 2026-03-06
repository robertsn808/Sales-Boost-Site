import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import {
  Check, ArrowRight, ChevronDown, DollarSign, TrendingUp, Star,
  Phone, Headphones, MapPin, Sparkles, Calculator, ShieldCheck,
  AlertTriangle, Clock, Users,
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
  }, [inView]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ─── 1. Hero — Lead with pain ───────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Video */}
      <div className="relative w-full">
        <video autoPlay loop muted playsInline preload="auto" src="/videos/hero-bg-v3.mp4?v=20260305" className="w-full h-auto block" aria-label="Hawaii business payment processing" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="pb-10 sm:pb-14 -mt-12 sm:-mt-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3" variants={fadeUp}>
              Every swipe costs you.{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">We make it $0.</span>
            </motion.h1>

            <motion.p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-lg mx-auto" variants={fadeUp}>
              Most Hawaii businesses lose 2–4% on every card transaction. TechSavvy eliminates that with a compliant cash discount program.
            </motion.p>

            {/* 3-card comparison */}
            <motion.div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto mb-8" variants={fadeUp}>
              <Card className="border-red-500/15 text-center">
                <CardContent className="p-3 sm:p-5">
                  <div className="text-lg sm:text-3xl font-extrabold text-red-400 mb-1">-$800</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground leading-tight">Avg restaurant<br/>per month</div>
                </CardContent>
              </Card>
              <Card className="border-primary/30 bg-primary/5 text-center ring-2 ring-primary/20">
                <CardContent className="p-3 sm:p-5">
                  <div className="text-lg sm:text-3xl font-extrabold text-primary mb-1">$0</div>
                  <div className="text-[9px] sm:text-xs text-foreground font-semibold leading-tight">With TechSavvy<br/>every month</div>
                </CardContent>
              </Card>
              <Card className="border-red-500/15 text-center">
                <CardContent className="p-3 sm:p-5">
                  <div className="text-lg sm:text-3xl font-extrabold text-red-400 mb-1">-$1,500</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground leading-tight">Avg auto shop<br/>per month</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6" variants={fadeUp}>
              <Button size="lg" className="text-base px-8 py-6 w-full sm:w-auto" asChild>
                <a href="/statement-review">
                  Free AI Statement Analysis
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-6 py-6 w-full sm:w-auto" asChild>
                <a href="/contact">
                  Talk to Our Team
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                <MapPin className="w-3 h-3 mr-1" />
                Built for Hawai'i Small Businesses
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── 2. The Problem — How much you're losing ────────────────────────────────

// ─── 3. How It Works — Remove uncertainty ───────────────────────────────────

function HowItWorks() {
  const StepApply = () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Phone */}
      <rect x="60" y="15" width="80" height="130" rx="14" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="2"/>
      <rect x="70" y="30" width="60" height="90" rx="4" fill="hsl(var(--primary) / 0.05)"/>
      {/* Form lines */}
      <rect x="78" y="42" width="44" height="6" rx="3" fill="hsl(var(--primary) / 0.2)"/>
      <rect x="78" y="56" width="44" height="6" rx="3" fill="hsl(var(--primary) / 0.15)"/>
      <rect x="78" y="70" width="44" height="6" rx="3" fill="hsl(var(--primary) / 0.15)"/>
      {/* Submit button */}
      <rect x="78" y="86" width="44" height="14" rx="7" fill="hsl(var(--primary))"/>
      <text x="100" y="96" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">APPLY</text>
      {/* Checkmarks floating */}
      <circle cx="150" cy="40" r="10" fill="hsl(var(--primary) / 0.15)"/>
      <path d="M145 40l3 3 7-7" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="45" cy="60" r="8" fill="hsl(var(--primary) / 0.1)"/>
      <path d="M41 60l2.5 2.5 5.5-5.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Clock */}
      <circle cx="155" cy="110" r="14" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5"/>
      <text x="155" y="114" textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontWeight="700">3m</text>
    </svg>
  );

  const StepApproved = () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Document */}
      <rect x="50" y="20" width="100" height="120" rx="10" fill="hsl(var(--primary) / 0.06)" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2"/>
      {/* Header */}
      <rect x="65" y="35" width="70" height="8" rx="4" fill="hsl(var(--primary) / 0.15)"/>
      {/* Lines */}
      <rect x="65" y="52" width="55" height="5" rx="2.5" fill="hsl(var(--primary) / 0.1)"/>
      <rect x="65" y="63" width="70" height="5" rx="2.5" fill="hsl(var(--primary) / 0.1)"/>
      <rect x="65" y="74" width="45" height="5" rx="2.5" fill="hsl(var(--primary) / 0.1)"/>
      {/* Savings highlight */}
      <rect x="65" y="90" width="70" height="22" rx="6" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1"/>
      <text x="100" y="104" textAnchor="middle" fill="hsl(var(--primary))" fontSize="11" fontWeight="800">-$1,200/mo</text>
      {/* Big approval stamp */}
      <circle cx="155" cy="45" r="22" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="2.5"/>
      <path d="M145 45l5 5 13-13" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 24h badge */}
      <rect x="30" y="95" width="28" height="22" rx="11" fill="hsl(var(--primary) / 0.15)"/>
      <text x="44" y="109" textAnchor="middle" fill="hsl(var(--primary))" fontSize="8" fontWeight="700">24h</text>
    </svg>
  );

  const StepSetup = () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Terminal */}
      <rect x="60" y="30" width="80" height="95" rx="10" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="2"/>
      {/* Screen */}
      <rect x="70" y="40" width="60" height="45" rx="5" fill="hsl(var(--primary) / 0.05)" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1"/>
      {/* Screen content - card icon */}
      <rect x="88" y="52" width="24" height="16" rx="3" fill="hsl(var(--primary) / 0.2)"/>
      <circle cx="95" cy="60" r="3" fill="hsl(var(--primary) / 0.3)"/>
      {/* Keypad dots */}
      {[0,1,2].map(r => [0,1,2].map(c => (
        <circle key={`${r}${c}`} cx={82 + c * 18} cy={96 + r * 10} r="3" fill="hsl(var(--primary) / 0.15)"/>
      )))}
      {/* Person silhouette */}
      <circle cx="35" cy="55" r="10" fill="hsl(var(--primary) / 0.12)"/>
      <path d="M20 90 Q35 75 50 90" fill="hsl(var(--primary) / 0.08)"/>
      {/* Arrow from person to terminal */}
      <path d="M48 72 L60 65" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" strokeDasharray="3 3"/>
      {/* Wrench */}
      <circle cx="168" cy="50" r="16" fill="hsl(var(--primary) / 0.1)"/>
      <text x="168" y="55" textAnchor="middle" fontSize="16">🔧</text>
      {/* Signage */}
      <rect x="155" y="100" width="30" height="20" rx="4" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1"/>
      <text x="170" y="113" textAnchor="middle" fill="hsl(var(--primary))" fontSize="6" fontWeight="700">SIGNAGE</text>
    </svg>
  );

  const StepSave = () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Rising bar chart */}
      <rect x="35" y="100" width="22" height="40" rx="4" fill="hsl(var(--primary) / 0.15)"/>
      <rect x="65" y="75" width="22" height="65" rx="4" fill="hsl(var(--primary) / 0.2)"/>
      <rect x="95" y="50" width="22" height="90" rx="4" fill="hsl(var(--primary) / 0.3)"/>
      <rect x="125" y="25" width="22" height="115" rx="4" fill="hsl(var(--primary))"/>
      {/* Arrow going up */}
      <path d="M40 95 L135 20" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 3" opacity="0.4"/>
      <polygon points="135,15 140,25 130,25" fill="hsl(var(--primary) / 0.4)"/>
      {/* $0 fee badge */}
      <circle cx="165" cy="45" r="22" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="2"/>
      <text x="165" y="43" textAnchor="middle" fill="hsl(var(--primary))" fontSize="14" fontWeight="800">$0</text>
      <text x="165" y="54" textAnchor="middle" fill="hsl(var(--primary))" fontSize="6" fontWeight="600">FEES</text>
      {/* Money symbols floating */}
      <text x="160" y="100" fill="hsl(var(--primary) / 0.3)" fontSize="18" fontWeight="700">$</text>
      <text x="175" y="120" fill="hsl(var(--primary) / 0.2)" fontSize="14" fontWeight="700">$</text>
      <text x="25" y="80" fill="hsl(var(--primary) / 0.15)" fontSize="12" fontWeight="700">$</text>
    </svg>
  );

  const illustrations = [StepApply, StepApproved, StepSetup, StepSave];

  const steps = [
    { num: "01", title: "Apply in 3 minutes", desc: "Quick online application. No paperwork, no fax machines. Just a few questions about your business." },
    { num: "02", title: "Get approved", desc: "Usually within 24 hours. We review your info and show you exactly how much you'll save." },
    { num: "03", title: "We set up your POS", desc: "Our local team configures your terminal, installs signage, and trains your staff. You don't touch a thing." },
    { num: "04", title: "Start saving immediately", desc: "Accept payments with $0 processing fees from day one. Keep 100% of every sale." },
  ];

  return (
    <section className="pt-6 pb-16 sm:pt-8 sm:pb-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              How It Works
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-[80px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 max-w-3xl mx-auto">
              {steps.map((step, i) => {
                const Illustration = illustrations[i];
                return (
                  <motion.div key={step.num} variants={fadeUp}>
                    <div className="relative group text-center h-full max-w-[160px] sm:max-w-none mx-auto">
                      {/* Illustration */}
                      <div className="mx-auto w-full max-w-[100px] sm:max-w-[150px] mb-2 sm:mb-3">
                        <Illustration />
                      </div>
                      {/* Card body */}
                      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-3 sm:p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                        <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold mb-1.5">{step.num}</div>
                        <h3 className="font-bold text-xs sm:text-sm mb-1">{step.title}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div className="text-center mt-10" variants={fadeUp}>
            <Button size="lg" asChild>
              <a href="/apply">
                Apply Now — Takes 3 Minutes
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 4. Qualify for Free Equipment ──────────────────────────────────────────

function QualifySection() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ businessType: "", volume: "", currentProcessor: "", name: "", phone: "", email: "", businessName: "" });
  const [result, setResult] = useState<"qualified" | "contact" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const businessTypes = [
    "Restaurant / Bar", "Retail Store", "Salon / Spa", "Auto Repair",
    "Medical / Dental", "Food Truck", "Vape / CBD Shop", "Other",
  ];

  const volumes = [
    { label: "Under $5K/month", value: "under-5k", qualifies: false },
    { label: "$5K – $10K/month", value: "5k-10k", qualifies: false },
    { label: "$10K – $25K/month", value: "10k-25k", qualifies: true },
    { label: "$25K – $50K/month", value: "25k-50k", qualifies: true },
    { label: "$50K – $100K/month", value: "50k-100k", qualifies: true },
    { label: "$100K+/month", value: "100k-plus", qualifies: true },
  ];

  const processors = [
    "Square", "Clover", "Toast", "Heartland", "Bank Processor", "Not sure", "Other",
  ];

  const submitForm = async (qualified: boolean) => {
    setSubmitting(true);
    try {
      await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: answers.businessName || `${answers.businessType} - Equipment Qualification`,
          contactName: answers.name,
          phone: answers.phone,
          email: answers.email,
          plan: qualified ? "free-equipment-qualified" : "free-equipment-under-volume",
          monthlyProcessing: answers.volume,
          bestContactTime: "anytime",
          highRisk: false,
        }),
      });
    } catch (e) {}
    setResult(qualified ? "qualified" : "contact");
    setSubmitting(false);
  };

  const progressPercent = Math.min((step / 4) * 100, 100);

  if (result === "qualified") {
    return (
      <section className="py-16 sm:py-24" id="qualify">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardContent className="p-8 sm:p-12 text-center relative">
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-primary">You Qualify! 🤙</h2>
              <p className="text-lg font-semibold text-foreground mb-3">Mahalo! Your business qualifies for a free equipment upgrade.</p>
              <p className="text-muted-foreground mb-6">
                One of our local team members will reach out within 24 hours to get your new POS system set up — at no cost.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Equipment", value: "FREE" },
                  { label: "Setup", value: "FREE" },
                  { label: "Monthly Fees", value: "$0" },
                ].map((item) => (
                  <div key={item.label} className="bg-primary/5 rounded-lg p-3">
                    <div className="text-lg font-extrabold text-primary">{item.value}</div>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
              <img src="/images/pos-equipment.jpeg" alt="Free POS equipment" className="w-full max-w-xs mx-auto rounded-xl mb-4" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (result === "contact") {
    return (
      <section className="py-16 sm:py-24" id="qualify">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-chart-4/30 overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-chart-4/15 flex items-center justify-center mx-auto mb-5">
                <Phone className="w-8 h-8 text-chart-4" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">We'll Be In Touch!</h2>
              <p className="text-muted-foreground mb-4">
                Your business may still qualify for reduced-cost equipment or special pricing. One of our Hawaii team members will contact you within 24 hours to discuss your options.
              </p>
              <p className="text-sm text-foreground font-medium">
                We work with businesses of all sizes — there's a plan for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const inputClass = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary";

  return (
    <section className="py-16 sm:py-24 relative" id="qualify">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <Sparkles className="w-3 h-3 mr-1" />
              Free Equipment Upgrade
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Does your business qualify for{" "}
              <span className="text-primary">free equipment?</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Answer 4 quick questions to find out. Takes about 30 seconds.
            </p>
          </div>

          <Card className="border-primary/15 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1.5 bg-muted">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>

            <CardContent className="p-6 sm:p-8">
              {/* Step indicator */}
              {step < 4 && result === null && (
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of 4</span>
                  <span className="text-xs text-muted-foreground">{["Business Type", "Monthly Volume", "Current Processor", "Contact Info"][step]}</span>
                </div>
              )}

              {step === 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-4">What type of business do you run?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {businessTypes.map((biz) => (
                      <button
                        key={biz}
                        type="button"
                        onClick={() => { setAnswers(a => ({ ...a, businessType: biz })); setStep(1); }}
                        className="rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 p-3 text-sm font-medium text-foreground transition-all text-left"
                      >
                        {biz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">How much do you process in card payments monthly?</p>
                  <p className="text-xs text-muted-foreground mb-4">Your best estimate is fine.</p>
                  <div className="space-y-2.5">
                    {volumes.map((vol) => (
                      <button
                        key={vol.value}
                        type="button"
                        onClick={() => { setAnswers(a => ({ ...a, volume: vol.value })); setStep(2); }}
                        className="w-full rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 p-3 text-sm font-medium text-foreground transition-all text-left"
                      >
                        {vol.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-4">Who processes your payments now?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {processors.map((proc) => (
                      <button
                        key={proc}
                        type="button"
                        onClick={() => { setAnswers(a => ({ ...a, currentProcessor: proc })); setStep(3); }}
                        className="rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 p-3 text-sm font-medium text-foreground transition-all text-left"
                      >
                        {proc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-4">Almost done — where should we send your results?</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Business Name</label>
                      <input value={answers.businessName} onChange={(e) => setAnswers(a => ({ ...a, businessName: e.target.value }))} placeholder="Your Business Name" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Your Name *</label>
                      <input required value={answers.name} onChange={(e) => setAnswers(a => ({ ...a, name: e.target.value }))} placeholder="Full Name" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                        <input type="tel" required value={answers.phone} onChange={(e) => setAnswers(a => ({ ...a, phone: e.target.value }))} placeholder="(808) 555-1234" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email *</label>
                        <input type="email" required value={answers.email} onChange={(e) => setAnswers(a => ({ ...a, email: e.target.value }))} placeholder="you@email.com" className={inputClass} />
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!answers.name || !answers.phone || !answers.email || submitting}
                      onClick={() => {
                        const vol = volumes.find(v => v.value === answers.volume);
                        submitForm(vol?.qualifies ?? false);
                      }}
                    >
                      {submitting ? "Checking..." : "See If I Qualify"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">No spam. We'll only contact you about your equipment qualification.</p>
                  </div>
                </div>
              )}

              {step > 0 && step < 4 && result === null && (
                <button onClick={() => setStep(s => s - 1)} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  ← Go back
                </button>
              )}
            </CardContent>
          </Card>

          {step < 3 && (
            <div className="mt-6 text-center">
              <img src="/images/pos-equipment.jpeg" alt="Free POS equipment upgrade" className="w-full max-w-sm mx-auto rounded-xl opacity-80" />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── 5. Savings Calculator ──────────────────────────────────────────────────

function SavingsCalculator() {
  const [volume, setVolume] = useState(25000);
  const [rate, setRate] = useState(3.3);
  const monthlyFees = volume * (rate / 100);
  const annualFees = monthlyFees * 12;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-16 sm:py-24 relative" id="calculator">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              How much are you <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">throwing away</span> every month?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Slide the bar. See the number. That's real money leaving your business.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="border-primary/15">
              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
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

                  <div className="flex flex-col justify-center">
                    <div className="text-center p-6 rounded-xl bg-red-500/5 border border-red-500/15 mb-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">You're losing every year</div>
                      <div className="text-4xl sm:text-5xl font-extrabold text-red-400">{fmt(annualFees)}</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/15">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">You'd keep with TechSavvy</div>
                      <div className="text-4xl sm:text-5xl font-extrabold text-primary">{fmt(annualFees)}</div>
                    </div>
                    <div className="mt-4 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">Share:</span>
                        <button
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://techsavvyhawaii.com")}&quote=${encodeURIComponent(`I just found out I'm losing ${fmt(annualFees)}/year to credit card fees! Check yours:`)}`, "_blank", "width=600,height=400")}
                          className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
                          title="Share on Facebook"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </button>
                        <button
                          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just found out my business is losing ${fmt(annualFees)}/year to credit card fees! 😱 Check yours free:`)}&url=${encodeURIComponent("https://techsavvyhawaii.com")}`, "_blank", "width=600,height=400")}
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 6. Competitor Comparison ───────────────────────────────────────────────

function CompareSection() {
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
              Why local businesses are switching.
            </h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden border-background/20 bg-background/10 backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-background/10">
                      <th className="text-left p-4 font-semibold text-background/60 w-[28%]"></th>
                      <th className="text-center p-4 w-[24%] text-background/60 font-semibold">Square</th>
                      <th className="text-center p-4 w-[24%] text-background/60 font-semibold">Clover</th>
                      <th className="text-center p-4 w-[24%] bg-primary/20 rounded-t-lg">
                        <span className="font-bold text-primary">TechSavvy</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: "Processing Fees", sq: "2.6–3.5%", cl: "2.3–3.5%", ts: "0%", big: true },
                      { f: "Monthly Fees", sq: "$0–$60+", cl: "$14.95–$85", ts: "$0", big: true },
                      { f: "Contracts", sq: "No", cl: "Sometimes", ts: "Never", big: false },
                      { f: "Setup Time", sq: "Medium", cl: "Medium", ts: "Fast", big: false },
                      { f: "Hardware Cost", sq: "$$$", cl: "$$$", ts: "Free*", big: false },
                      { f: "Local Hawaii Support", sq: "No", cl: "No", ts: "Yes", big: true },
                    ].map((r, i) => (
                      <tr key={r.f} className={`border-b border-background/10 ${i % 2 ? "bg-background/5" : ""}`}>
                        <td className="p-3 sm:p-4 font-medium text-background/70">{r.f}</td>
                        <td className="p-3 sm:p-4 text-center text-red-300/80">{r.sq}</td>
                        <td className="p-3 sm:p-4 text-center text-red-300/80">{r.cl}</td>
                        <td className={`p-3 sm:p-4 text-center bg-primary/20 ${r.big ? "text-primary font-bold text-base sm:text-lg" : "text-primary font-semibold"}`}>{r.ts}</td>
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

// ─── 7. Who We Work With ────────────────────────────────────────────────────

function WhoWeWorkWith() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              If you accept credit cards, we can save you money.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              We work with all types of Hawaii businesses — from food trucks to medical offices.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Restaurants & Bars", link: "/industries/restaurants" },
              { name: "Food Trucks", link: null },
              { name: "Salons & Spas", link: "/industries/salons" },
              { name: "Auto Repair Shops", link: "/industries/auto-shops" },
              { name: "Retail Stores", link: null },
              { name: "Medical & Dental", link: null },
              { name: "Vape & CBD Shops", link: null },
              { name: "Convenience Stores", link: null },
            ].map((biz) => (
              <motion.div key={biz.name} variants={fadeUp}>
                {biz.link ? (
                  <a href={biz.link}>
                    <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer card-warm">
                      <CardContent className="p-4 sm:p-5 text-center">
                        <div className="text-sm font-semibold text-foreground/90">{biz.name}</div>
                        <div className="text-[10px] text-primary mt-1">Learn more →</div>
                      </CardContent>
                    </Card>
                  </a>
                ) : (
                  <Card className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 sm:p-5 text-center">
                      <div className="text-sm font-semibold text-foreground/90">{biz.name}</div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
          <motion.p className="text-center text-muted-foreground text-sm mt-6" variants={fadeUp}>
            Plus hotels, gas stations, contractors, nonprofits, and more.{" "}
            <a href="#qualify" className="text-primary font-medium underline underline-offset-2">See if you qualify for free equipment →</a>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 8. Trust — Built for Hawai'i.────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-5">
              Built for Hawai'i.{" "}
              <span className="text-primary">Run by Hawai'i.</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
              We're not a mainland company with a 1-800 number. We're local. When you call, a real person from Hawaii picks up. When you need help, someone comes to your business — not an email bot.
            </p>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              Our reputation in the community is everything. That's why we never lock you in a contract — we earn your business every single month.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "No contracts — ever",
                "Next-day funding",
                "24/7 support",
                "Local Hawaii team",
                "Rates locked in",
                "Accept all cards",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-full px-4 py-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground/90">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12 text-center">
              <MapPin className="w-14 h-14 text-primary mx-auto mb-4" />
              <div className="text-2xl font-bold text-foreground mb-2">Locally Owned & Operated</div>
              <div className="text-muted-foreground mb-6">Honolulu, O'ahu · Serving all islands</div>
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

// ─── 8b. Local Trust Badges ─────────────────────────────────────────────────

function LocalTrustBadges() {
  return (
    <section className="py-10 sm:py-14 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Trusted by Hawai'i businesses · Compliant with all major card networks</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60">
            {[
              { name: "Visa", svg: <svg className="h-8 sm:h-10" viewBox="0 0 100 32" fill="none"><text x="5" y="25" fontFamily="var(--font-heading)" fontWeight="800" fontSize="28" fill="currentColor">VISA</text></svg> },
              { name: "Mastercard", svg: <svg className="h-8 sm:h-10" viewBox="0 0 140 32"><circle cx="52" cy="16" r="14" fill="#EB001B" opacity="0.7"/><circle cx="82" cy="16" r="14" fill="#F79E1B" opacity="0.7"/><text x="50" y="38" fontFamily="var(--font-heading)" fontSize="8" fill="currentColor" opacity="0.6"></text></svg> },
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />PCI DSS Compliant</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />FTC Compliant</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" />BBB Accredited</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />Honolulu, HI</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 9. Testimonials ────────────────────────────────────────────────────────

function TestimonialSection() {
  const testimonials = [
    { name: "Restaurant Owner", loc: "Waikiki", quote: "We were losing over $1,200 a month and didn't even know it. TechSavvy showed us the numbers and switched us over in a week. Best business decision we made this year." },
    { name: "Nail Salon Owner", loc: "Kailua", quote: "Switching was so easy. TechSavvy's local team set everything up and we got a new terminal for free. The savings are real — we see it every month." },
    { name: "Aloha Light Center", loc: "Honolulu", quote: "TechSavvy made the whole process seamless. No more processing fees eating into our revenue every month. Their local team is always a phone call away — couldn't ask for better service." },
    { name: "Spa Owner", loc: "Waikiki", quote: "Great rates, great service, and the equipment was free. I tell every business owner I know about TechSavvy." },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Hawaii business owners who stopped losing money.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border/50 card-warm">
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
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

// ─── 10. FAQ — Address fears ────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Is this actually legal?", a: "Yes — 100% legal in Hawaii and all 50 states. Visa, Mastercard, and the FTC all allow it when properly disclosed. We handle all the compliance and signage for you." },
    { q: "Will my customers get mad about the surcharge?", a: "Most don't even notice. It's the same model gas stations have used for years — cash price vs. card price. It's now standard at restaurants, salons, and retail stores across Hawaii." },
    { q: "Is it hard to switch processors?", a: "Not at all. We handle everything — terminal, programming, signage, training. Most businesses are up and running in 3–7 days. You don't cancel your old processor until you're ready." },
    { q: "How much will I actually save?", a: "That depends on your volume, but most Hawaii businesses save $500–$3,000+ per month. We'll show you your exact number with a free statement analysis — no commitment required." },
    { q: "What if I don't like it?", a: "No contract. No cancellation fee. If it's not working for you, you can leave anytime with zero penalty. We keep businesses by saving them money, not by trapping them." },
    { q: "Do I have to buy the terminal?", a: "If you process $5K+ per month, the terminal is free. We ship it, set it up, and train your team. You don't pay a dime for equipment." },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Questions you're probably thinking.
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

// ─── 11. Contact Form ───────────────────────────────────────────────────────

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function Home() {
  useSEO({
    title: "Zero-Fee Payment Processing for Hawaii Businesses | TechSavvy Hawaii",
    description: "Hawaii businesses save $6,000–$36,000/year by eliminating credit card fees. Compliant cash discount program, free equipment, no contracts. Locally owned in Honolulu. Apply in 3 minutes.",
    keywords: "zero fee payment processing Hawaii, eliminate credit card fees Honolulu, cash discount program Hawaii, merchant services Oahu, no contract payment processor, TechSavvy Hawaii, free POS terminal, high risk merchant Hawaii",
    canonical: "https://techsavvyhawaii.com/",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      <HeroSection />
      <HowItWorks />
      <SavingsCalculator />
      <WhoWeWorkWith />
      <CompareSection />
      <QualifySection />
      <TrustSection />
      <LocalTrustBadges />
      <TestimonialSection />
      <FAQSection />
    </Layout>
  );
}
