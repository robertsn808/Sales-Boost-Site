import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  User,
  ShoppingCart,
  PenTool,
  Check,
  Sparkles,
  PartyPopper,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { fadeUp } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

const STRUCTURES = [
  { value: "sole-proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "LLC" },
];

const STEPS = [
  {
    id: "business",
    icon: Building2,
    title: "Let's Start",
    subtitle: "First things first — tell us about your business.",
    emoji: "👋",
  },
  {
    id: "location",
    icon: MapPin,
    title: "Where Are You?",
    subtitle: "Where can customers find you?",
    emoji: "📍",
  },
  {
    id: "structure",
    icon: Briefcase,
    title: "Business Details",
    subtitle: "A few quick details about your setup.",
    emoji: "🏢",
  },
  {
    id: "owner",
    icon: User,
    title: "About You",
    subtitle: "Who's running the show?",
    emoji: "🤝",
  },
  {
    id: "sales",
    icon: ShoppingCart,
    title: "Your Sales",
    subtitle: "Help us find the best fit for you.",
    emoji: "📊",
  },
  {
    id: "signature",
    icon: PenTool,
    title: "Almost Done!",
    subtitle: "One last thing — make it official.",
    emoji: "✍️",
  },
];

type FormData = {
  businessLegalName: string;
  dba: string;
  businessPhone: string;
  businessEmail: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  businessStructure: string;
  businessStartDate: string;
  federalTaxId: string;
  ownerName: string;
  ownerTitle: string;
  ownershipPercent: string;
  ownerPhone: string;
  ownerEmail: string;
  productsSold: string;
  avgMonthlyVolume: string;
  avgTicket: string;
  percentCardPresent: string;
  signatureName: string;
  agreedToTerms: boolean;
};

const INITIAL_DATA: FormData = {
  businessLegalName: "",
  dba: "",
  businessPhone: "",
  businessEmail: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  businessStructure: "",
  businessStartDate: "",
  federalTaxId: "",
  ownerName: "",
  ownerTitle: "",
  ownershipPercent: "",
  ownerPhone: "",
  ownerEmail: "",
  productsSold: "",
  avgMonthlyVolume: "",
  avgTicket: "",
  percentCardPresent: "",
  signatureName: "",
  agreedToTerms: false,
};

function MilestoneMessage({ step }: { step: number }) {
  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="text-center py-2"
      >
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
          <PartyPopper className="w-3 h-3 mr-1" />
          Halfway there — you're flying through this!
        </Badge>
      </motion.div>
    );
  }
  if (step === 5) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="text-center py-2"
      >
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          One more step — you're almost done!
        </Badge>
      </motion.div>
    );
  }
  return null;
}

export default function ApplyPage() {
  useSEO({
    title: "Apply Now | TechSavvy Hawaii — Zero-Fee Payment Processing",
    description:
      "Apply for zero-fee payment processing in under 3 minutes. No paperwork, no fax machines.",
    canonical: "https://techsavvyhawaii.com/apply",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof FormData, value: string | boolean) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!(data.businessLegalName && data.businessPhone && data.businessEmail);
      case 1:
        return !!(data.address && data.city && data.state && data.zip);
      case 2:
        return !!data.businessStructure;
      case 3:
        return !!data.ownerName;
      case 4:
        return true;
      case 5:
        return !!(data.signatureName && data.agreedToTerms);
      default:
        return false;
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/merchant-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const currentStep = STEPS[step];

  if (submitted) {
    return (
      <Layout>
        <section className="py-20 sm:py-32">
          <div className="max-w-lg mx-auto px-4 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">You're All Set!</h1>
              <p className="text-muted-foreground text-lg mb-2">
                Your application has been submitted. We'll review it and reach out within one business day.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                We'll collect banking details and any remaining info over the phone — no sensitive data needed online.
              </p>
              <Button size="lg" asChild>
                <Link href="/">
                  Back to Home
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            {/* Header */}
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">
                <Clock className="w-3 h-3 mr-1.5" />
                Takes about 3 minutes
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Apply for Zero-Fee Processing
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                No paperwork. No fax machines. Just a few quick questions.
              </p>
            </div>

            {/* Progress */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Milestone */}
            <AnimatePresence mode="wait">
              <MilestoneMessage step={step} />
            </AnimatePresence>

            {/* Step Card */}
            <Card className="overflow-visible border-primary/10 mt-4">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
              <CardContent className="p-6 sm:p-8 relative">
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <currentStep.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-lg">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                  </div>
                </div>

                {/* Animated Step Content */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {step === 0 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Business Legal Name *</label>
                          <input
                            className={INPUT_CLASS}
                            placeholder="e.g. Aloha Coffee LLC"
                            value={data.businessLegalName}
                            onChange={(e) => set("businessLegalName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">DBA (if different)</label>
                          <input
                            className={INPUT_CLASS}
                            placeholder="e.g. Aloha Joe's"
                            value={data.dba}
                            onChange={(e) => set("dba", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Business Phone *</label>
                            <input
                              className={INPUT_CLASS}
                              type="tel"
                              placeholder="(808) 555-1234"
                              value={data.businessPhone}
                              onChange={(e) => set("businessPhone", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Business Email *</label>
                            <input
                              className={INPUT_CLASS}
                              type="email"
                              placeholder="you@business.com"
                              value={data.businessEmail}
                              onChange={(e) => set("businessEmail", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Street Address *</label>
                          <input
                            className={INPUT_CLASS}
                            placeholder="123 Kalakaua Ave"
                            value={data.address}
                            onChange={(e) => set("address", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">City *</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="Honolulu"
                              value={data.city}
                              onChange={(e) => set("city", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">State *</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="HI"
                              maxLength={2}
                              value={data.state}
                              onChange={(e) => set("state", e.target.value.toUpperCase())}
                            />
                          </div>
                          <div className="space-y-1.5 col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium">Zip *</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="96815"
                              maxLength={10}
                              value={data.zip}
                              onChange={(e) => set("zip", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Business Structure *</label>
                          <div className="grid grid-cols-2 gap-3">
                            {STRUCTURES.map((s) => (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => set("businessStructure", s.value)}
                                className={`rounded-lg border p-3 text-sm font-medium text-center transition-all ${
                                  data.businessStructure === s.value
                                    ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                                    : "border-border hover:border-primary/40"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Business Start Date</label>
                            <input
                              className={INPUT_CLASS}
                              type="date"
                              value={data.businessStartDate}
                              onChange={(e) => set("businessStartDate", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Federal Tax ID (EIN)</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="XX-XXXXXXX"
                              value={data.federalTaxId}
                              onChange={(e) => set("federalTaxId", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Full Name *</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="Your full name"
                              value={data.ownerName}
                              onChange={(e) => set("ownerName", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="e.g. Owner, CEO"
                              value={data.ownerTitle}
                              onChange={(e) => set("ownerTitle", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Ownership %</label>
                            <input
                              className={INPUT_CLASS}
                              placeholder="100"
                              value={data.ownershipPercent}
                              onChange={(e) => set("ownershipPercent", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Phone</label>
                            <input
                              className={INPUT_CLASS}
                              type="tel"
                              placeholder="(808) 555-1234"
                              value={data.ownerPhone}
                              onChange={(e) => set("ownerPhone", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <input
                              className={INPUT_CLASS}
                              type="email"
                              placeholder="you@email.com"
                              value={data.ownerEmail}
                              onChange={(e) => set("ownerEmail", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">What products/services do you sell?</label>
                          <input
                            className={INPUT_CLASS}
                            placeholder="e.g. Coffee, pastries, retail goods"
                            value={data.productsSold}
                            onChange={(e) => set("productsSold", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Avg Monthly Volume</label>
                            <select
                              className={INPUT_CLASS}
                              value={data.avgMonthlyVolume}
                              onChange={(e) => set("avgMonthlyVolume", e.target.value)}
                            >
                              <option value="">Select range</option>
                              <option value="under-5k">Under $5K</option>
                              <option value="5k-10k">$5K - $10K</option>
                              <option value="10k-25k">$10K - $25K</option>
                              <option value="25k-50k">$25K - $50K</option>
                              <option value="50k-100k">$50K - $100K</option>
                              <option value="100k-plus">$100K+</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Avg Ticket Size</label>
                            <select
                              className={INPUT_CLASS}
                              value={data.avgTicket}
                              onChange={(e) => set("avgTicket", e.target.value)}
                            >
                              <option value="">Select range</option>
                              <option value="under-25">Under $25</option>
                              <option value="25-50">$25 - $50</option>
                              <option value="50-100">$50 - $100</option>
                              <option value="100-250">$100 - $250</option>
                              <option value="250-plus">$250+</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">% In-Person</label>
                            <select
                              className={INPUT_CLASS}
                              value={data.percentCardPresent}
                              onChange={(e) => set("percentCardPresent", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="100">100% In-Person</option>
                              <option value="75">~75% In-Person</option>
                              <option value="50">~50/50</option>
                              <option value="25">~75% Online</option>
                              <option value="0">100% Online</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Type Your Full Name as Signature *</label>
                          <input
                            className={`${INPUT_CLASS} font-serif text-lg italic`}
                            placeholder="Your full legal name"
                            value={data.signatureName}
                            onChange={(e) => set("signatureName", e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            By typing your name, you authorize TechSavvy to process your application.
                          </p>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={data.agreedToTerms}
                            onClick={() => set("agreedToTerms", !data.agreedToTerms)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors mt-0.5 ${
                              data.agreedToTerms ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                          >
                            <span
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                                data.agreedToTerms ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                          <p className="text-sm text-foreground/80">
                            I agree to be contacted by TechSavvy regarding payment processing services.
                            I understand that sensitive information (banking, SSN) will be collected securely
                            over the phone — not through this form.
                          </p>
                        </div>

                        {error && (
                          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
                  {step > 0 ? (
                    <Button variant="ghost" size="sm" onClick={back}>
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < STEPS.length - 1 ? (
                    <Button size="sm" onClick={next} disabled={!canAdvance()}>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!canAdvance() || submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                      {!submitting && <Check className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-primary"
                      : i < step
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            {/* Bottom trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>No sensitive data collected online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Response within 1 business day</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
