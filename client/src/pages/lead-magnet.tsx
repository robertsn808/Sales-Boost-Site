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
  Check,
  CheckCircle,
  ArrowRight,
  Download,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

const LEAD_MAGNETS: Record<string, {
  title: string;
  subtitle: string;
  badge: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
}> = {
  "statement-checklist": {
    title: "Top 10 Things to Check on Your Merchant Statement",
    subtitle: "Spot hidden fees, inflated rates, and junk charges in under 10 minutes",
    badge: "FREE GUIDE",
    bullets: [
      "Calculate your true effective rate and compare to industry benchmarks",
      "Identify PCI compliance fees, junk fees, and redundant charges",
      "Understand interchange-plus vs. tiered vs. flat rate pricing",
      "Quick-reference checklist you can use on any statement",
    ],
    icon: FileSearch,
  },
  "cash-discount-guide": {
    title: "Cash Discount Programs Explained",
    subtitle: "Is it right for your business? Legal in all 50 states — here's how it works",
    badge: "FREE GUIDE",
    bullets: [
      "Cash discount vs. surcharge — the legal difference that matters",
      "Step-by-step implementation checklist (signage, receipts, POS setup)",
      "Industry-specific fit analysis (restaurants, retail, salons, auto)",
      "Customer FAQ scripts your staff can use at checkout",
    ],
    icon: DollarSign,
  },
  "security-checklist": {
    title: "Payment Security Checklist for Small Businesses",
    subtitle: "PCI compliance, fraud prevention, and breach response — all in one checklist",
    badge: "FREE CHECKLIST",
    bullets: [
      "PCI compliance self-assessment walkthrough",
      "Terminal and POS security hardening steps",
      "Card-present and card-not-present fraud prevention tactics",
      "Incident response plan template if a breach is suspected",
    ],
    icon: ShieldCheck,
  },
  "rate-comparison": {
    title: "Industry-Specific Rate Comparison Guide",
    subtitle: "Know if you're overpaying — benchmarks for restaurants, retail, salons, auto, medical & more",
    badge: "FREE GUIDE",
    bullets: [
      "Rate benchmarks for 8 industry verticals (good / average / high)",
      "How to calculate your effective rate in 30 seconds",
      "Red flags that mean you're almost certainly overpaying",
      "5 questions to ask your processor that reveal the truth",
    ],
    icon: BarChart3,
  },
};

const BUSINESS_TYPES = [
  "Restaurant / Food Service",
  "Retail / Store",
  "Salon / Beauty",
  "Auto Repair / Service",
  "Medical / Dental",
  "Professional Services",
  "E-Commerce",
  "CBD / Vape / High-Risk",
  "Convenience Store",
  "Other",
];

function ThankYouPage() {
  useSEO({
    title: "Your Guide Is On the Way | TechSavvy Hawaii",
    description: "Check your email for the download link.",
  });

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
            Your Guide Is On the Way!
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Check your email — we'll send the download link shortly.
            In the meantime, want a personalized analysis?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="gap-2">
                Get a Free Statement Review
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                See How It Works
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

function LeadMagnetLanding({ slug }: { slug: string }) {
  const magnet = LEAD_MAGNETS[slug];
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    businessType: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!magnet) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground">Guide not found.</p>
        </div>
      </Layout>
    );
  }

  const Icon = magnet.icon;

  useSEO({
    title: `${magnet.title} | TechSavvy Hawaii`,
    description: magnet.subtitle,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/leads/public", {
        name: formData.name,
        business: formData.businessName,
        email: formData.email,
        phone: "",
        package: "terminal",
        notes: `Lead Magnet: ${magnet.title} | Type: ${formData.businessType}`,
      });
    } catch {
      // Still redirect — form submission is best-effort
    }
    setSubmitting(false);
    navigate("/free/thank-you");
  };

  return (
    <Layout>
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
            {/* Left — Guide details */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  {magnet.badge}
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight"
              >
                {magnet.title}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground mb-8"
              >
                {magnet.subtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">What's Inside</h3>
                </div>
                <ul className="space-y-3">
                  {magnet.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.p variants={fadeUp} className="text-sm text-muted-foreground/70">
                No spam. No credit card required. Instant access.
              </motion.p>
            </motion.div>

            {/* Right — Email gate form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Card className="border-primary/20 bg-card/80 backdrop-blur">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Get Instant Access</h3>
                      <p className="text-sm text-muted-foreground">Enter your details below</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Full Name *
                      </label>
                      <Input
                        required
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Business Email *
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="john@mybusiness.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Business Name *
                      </label>
                      <Input
                        required
                        placeholder="Smith's Restaurant"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Business Type *
                      </label>
                      <select
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      >
                        <option value="">Select your industry...</option>
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 mt-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Free Guide
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground/60 text-center">
                      By downloading, you agree to receive a follow-up email with
                      tips relevant to your business. Unsubscribe anytime.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default function LeadMagnetPage() {
  const [matchSlug, params] = useRoute("/free/:slug");

  if (!matchSlug || !params?.slug) {
    return <ThankYouPage />;
  }

  if (params.slug === "thank-you") {
    return <ThankYouPage />;
  }

  return <LeadMagnetLanding slug={params.slug} />;
}
