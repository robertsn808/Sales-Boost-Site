import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  FileSearch,
  DollarSign,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Download,
  Mail,
  CheckCircle,
  Upload,
  Star,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

const GUIDES = [
  {
    slug: "statement-checklist",
    title: "Top 10 Statement Checklist",
    description: "Spot hidden fees, inflated rates, and junk charges in under 10 minutes",
    icon: FileSearch,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
    bullets: [
      "Calculate your true effective rate",
      "Identify junk fees & PCI compliance charges",
      "Interchange-plus vs. tiered vs. flat rate",
    ],
    pdfUrl: "https://assets.techsavvyhawaii.com/website-resources/1771403190912-top-10-statement-check.pdf",
  },
  {
    slug: "rate-comparison",
    title: "Rate Comparison Guide",
    description: "Industry benchmarks for restaurants, retail, salons, medical & more",
    icon: BarChart3,
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
    bullets: [
      "Rate benchmarks for 8 industry verticals",
      "Calculate your effective rate in 30 seconds",
      "5 questions that reveal the truth",
    ],
    pdfUrl: "https://assets.techsavvyhawaii.com/website-resources/1771403189858-rate-comparison-guide.pdf",
  },
  {
    slug: "security-checklist",
    title: "Payment Security Checklist",
    description: "PCI compliance, fraud prevention, and breach response in one checklist",
    icon: ShieldCheck,
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-400",
    bullets: [
      "PCI compliance self-assessment walkthrough",
      "Terminal & POS security hardening",
      "Incident response plan template",
    ],
    pdfUrl: "https://assets.techsavvyhawaii.com/website-resources/1771403187943-payment-security-checklist.pdf",
  },
  {
    slug: "cash-discount-guide",
    title: "Cash Discount Guide",
    description: "Eliminate processing fees entirely — legal in all 50 states",
    icon: DollarSign,
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    bullets: [
      "Cash discount vs. surcharge — the legal difference",
      "Step-by-step implementation checklist",
      "Customer FAQ scripts for your staff",
    ],
    pdfUrl: "https://assets.techsavvyhawaii.com/website-resources/1771403188928-cash-discount-explained.pdf",
  },
];

export default function FreeGuidesPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);

  useSEO({
    title: "Free Credit Card Processing Guides | Reduce Payment Fees | TechSavvy Hawaii",
    description: "Free guides on credit card processing fees, merchant statement review, rate comparison, and cash discount programs. Learn how to eliminate payment processing fees for your Hawaii business.",
    keywords: "credit card processing guide, payment processing fees guide, merchant statement checklist, rate comparison guide, cash discount guide Hawaii, how to reduce credit card fees",
    canonical: "https://techsavvyhawaii.com/free-guides",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  const toggleGuide = (slug: string) => {
    setSelectedGuides(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSubmitting(true);
    try {
      // Send DIY guides email
      await apiRequest("POST", "/api/statement-review/email", {
        email,
        name,
        business,
        type: "guides",
      });
      // Also save as lead
      await apiRequest("POST", "/api/leads/public", {
        name,
        business,
        email,
        phone: "",
        package: "terminal",
        notes: `Lead Magnet Hub: ${selectedGuides.length > 0 ? selectedGuides.join(", ") : "All guides"}`,
      });
    } catch {
      // Still show success — form is best-effort
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-400/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Your Guides Are On the Way!
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Check your email — we're sending download links for all 4 guides right now.
              Want a personalized analysis instead?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/statement-review">
                <Button size="lg" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Free AI Statement Review
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="gap-2">
                  Get a Personal Review
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm">
                100% FREE — NO STRINGS ATTACHED
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl lg:text-5xl font-bold text-foreground mb-4 leading-tight"
            >
              Stop Overpaying on
              <span className="text-primary"> Processing Fees</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground mb-2"
            >
              4 free guides to help you read your merchant statement, spot hidden fees, and make smarter decisions about payment processing.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-sm text-muted-foreground/70"
            >
              Used by 200+ Hawaii businesses
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            {GUIDES.map((guide, i) => {
              const Icon = guide.icon;
              const isSelected = selectedGuides.includes(guide.slug);
              return (
                <motion.div
                  key={guide.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleGuide(guide.slug)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-6 h-6 ${guide.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">{guide.title}</h3>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{guide.description}</p>
                          <ul className="space-y-1">
                            {guide.bullets.map((b, j) => (
                              <li key={j} className="text-xs text-muted-foreground/80 flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Email Capture Form */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    Get All 4 Guides Free
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    We'll email you download links instantly. No spam, no sales pitch — just the guides.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Business name (optional)"
                      value={business}
                      onChange={e => setBusiness(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 gap-2 text-base font-bold"
                    disabled={submitting || !email || !name}
                  >
                    {submitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Email Me the Guides
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground/60 text-center">
                    No credit card. No obligation. Just free guides.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* AI Statement Review CTA */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-primary/20 overflow-hidden">
              <CardContent className="p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex items-center gap-2 justify-center lg:justify-start mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <Badge variant="outline" className="text-primary border-primary/30">AI-POWERED</Badge>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                      Want Us to Review It For You?
                    </h2>
                    <p className="text-slate-400 mb-6">
                      Upload your statement and our AI will grade it A–F, find every hidden fee, red flag, and junk charge, and estimate how much you're overpaying. Takes 30 seconds.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <Link href="/statement-review">
                        <Button size="lg" className="gap-2 font-bold">
                          <Upload className="w-4 h-4" />
                          Free AI Analysis
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button size="lg" variant="outline" className="gap-2 border-slate-600 text-slate-300 hover:text-white">
                          Talk to a Human
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col items-center gap-2 opacity-60">
                    <div className="text-6xl font-black text-primary">A+</div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">Sample grade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/60">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> PCI Compliant</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No Credit Card Required</span>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Zero Spam Guarantee</span>
          </div>
        </div>
      </section>
    </Layout>
  );
}
