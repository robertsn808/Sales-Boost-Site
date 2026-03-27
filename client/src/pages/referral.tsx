import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, Users, DollarSign, TrendingUp,
  Phone, Mail, Building, User, Sparkles, Star,
  Repeat, Wallet, Clock, ShieldCheck, Zap, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

// ─── Hero ───────────────────────────────────────────────────────────────────

function ReferralHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-36 sm:pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <Sparkles className="w-3 h-3 mr-1" />
              Business Opportunity
            </Badge>
          </motion.div>
          <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5" variants={fadeUp}>
            Earn{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              Residual Income
            </span>
            <br />
            <span className="text-2xl sm:text-3xl lg:text-4xl text-muted-foreground font-bold">
              By Referring Businesses to TechSavvy
            </span>
          </motion.h1>
          <motion.p className="text-sm sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto" variants={fadeUp}>
            Know a business owner who accepts credit cards? Make a simple introduction and earn money every month — for as long as they stay with TechSavvy. No selling required. Just connect.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
            <Button size="lg" className="w-full sm:w-auto text-base px-8" asChild>
              <a href="#apply">
                Become a Referral Partner
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <a href="#how-it-works">
                See How It Works
                <ChevronDown className="w-4 h-4" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <section className="py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: DollarSign, value: "$500–$2,000+", label: "Per Referral" },
            { icon: Repeat, value: "Monthly", label: "Residual Income" },
            { icon: Clock, value: "3 Minutes", label: "To Refer Someone" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="text-center border-primary/10">
                <CardContent className="p-4 sm:p-6">
                  <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { num: "01", icon: Users, title: "Identify a Business", desc: "Think of any business owner you know who accepts credit cards — a restaurant, salon, auto shop, retail store, or any business that processes payments." },
    { num: "02", icon: Phone, title: "Make a Simple Introduction", desc: "Mention TechSavvy and connect them to our team. No pitch, no selling. Just introduce them and let us handle the rest." },
    { num: "03", icon: Zap, title: "TechSavvy Closes the Deal", desc: "Our team runs a free savings analysis, presents the offer, handles all paperwork and setup. You don't need to know anything technical." },
    { num: "04", icon: Wallet, title: "You Get Paid — Every Month", desc: "Once the merchant is live and processing, you earn a commission. And as long as they stay with TechSavvy, you keep earning residual income every month." },
  ];

  return (
    <section className="py-14 sm:py-24" id="how-it-works">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-16" variants={fadeUp}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
              How You <span className="text-primary">Earn</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Four simple steps. No selling. No experience needed.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeUp}>
                <Card className="h-full border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-4xl font-extrabold text-primary/15">{step.num}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
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

// ─── Earnings Potential ─────────────────────────────────────────────────────

function EarningsSection() {
  const examples = [
    { business: "Coffee Shop", volume: "$15K/mo", payout: "$150–$600" },
    { business: "Restaurant", volume: "$35K/mo", payout: "$350–$1,400" },
    { business: "Auto Repair", volume: "$40K/mo", payout: "$400–$1,600" },
    { business: "Medical Office", volume: "$60K/mo", payout: "$600–$2,400" },
  ];

  return (
    <section className="py-14 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Your Earning <span className="text-primary">Potential</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Real numbers based on merchant processing volume. These are per-referral payouts — and you earn residual income every month after.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-4 font-semibold">Business Type</th>
                      <th className="text-center p-4 font-semibold">Monthly Volume</th>
                      <th className="text-center p-4 font-semibold text-primary">Your Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examples.map((row, i) => (
                      <tr key={row.business} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="p-4 font-medium">{row.business}</td>
                        <td className="p-4 text-center text-muted-foreground">{row.volume}</td>
                        <td className="p-4 text-center font-bold text-primary">{row.payout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          <motion.div className="mt-8 text-center" variants={fadeUp}>
            <Card className="border-primary/20 inline-block">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Example:</span> Refer just 5 restaurants processing $30K/month each → earn{" "}
                  <span className="font-bold text-primary">$1,500–$6,000+</span> in first-month payouts, plus{" "}
                  <span className="font-bold text-primary">monthly residual income</span> for as long as they stay.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Why Partner ─────────────────────────────────────────────────────────────

function WhyPartnerSection() {
  const reasons = [
    { icon: DollarSign, title: "Residual Income", desc: "Earn every month — not just once. As long as your referral processes with TechSavvy, you keep getting paid." },
    { icon: ShieldCheck, title: "Zero Investment Required", desc: "No fees, no inventory, no startup costs. Just make introductions and let TechSavvy close the deals." },
    { icon: Users, title: "No Selling Required", desc: "You're not a salesperson — you're a connector. Mention TechSavvy, make the intro, and our team handles everything." },
    { icon: TrendingUp, title: "Tier Advancement", desc: "The more you refer, the higher your payout percentage. Start earning immediately and grow your income over time." },
    { icon: Star, title: "Training & Support", desc: "Access our Partner Academy with scripts, training modules, and strategies to help you succeed." },
    { icon: Clock, title: "Works On Your Schedule", desc: "No hours, no quotas, no boss. Refer when you want, how you want. This is your side income, your way." },
  ];

  return (
    <section className="py-14 sm:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="text-center mb-10 sm:mb-14" variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Why Partner With <span className="text-primary">TechSavvy?</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reasons.map((r) => (
              <motion.div key={r.title} variants={fadeUp}>
                <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <r.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{r.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
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

// ─── Who Should Refer ───────────────────────────────────────────────────────

function WhoShouldRefer() {
  const people = [
    "Business owners who know other business owners",
    "Accountants, bookkeepers & financial advisors",
    "Real estate agents & commercial property managers",
    "Restaurant supply vendors & food distributors",
    "Insurance agents & business consultants",
    "Anyone with connections to local businesses",
  ];

  return (
    <section className="py-14 sm:py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5">
                Who's This <span className="text-primary">Perfect For?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                You don't need to be in payment processing. If you know people who own businesses, you can earn with TechSavvy.
              </p>
              <ul className="space-y-3">
                {people.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-10 text-center">
              <Repeat className="w-14 h-14 text-primary mx-auto mb-4" />
              <div className="text-2xl font-bold text-foreground mb-2">Residual Income</div>
              <p className="text-muted-foreground text-sm mb-4">
                Every merchant you refer becomes a source of monthly income. The more you refer, the more you earn — automatically.
              </p>
              <div className="text-4xl font-extrabold text-primary">$$$</div>
              <div className="text-xs text-muted-foreground mt-1">Every month, for every active merchant</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Application Form ───────────────────────────────────────────────────────

function ApplyForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", businessName: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: form.name,
          email: form.email,
          phone: form.phone,
          businessName: form.businessName || "Referral Partner Application",
          plan: "referral-partner",
          monthlyProcessing: "partner",
          bestContactTime: "anytime",
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary";

  if (submitted) {
    return (
      <section className="py-14 sm:py-24" id="apply">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-primary/20">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Application Received!</h2>
              <p className="text-muted-foreground">We'll reach out within 24 hours to get you set up as a TechSavvy referral partner. Mahalo!</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 sm:py-24" id="apply">
      <div className="max-w-xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Ready to Start <span className="text-primary">Earning?</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Fill out the form below and we'll get you set up as a TechSavvy referral partner — usually within 24 hours.
            </p>
          </div>

          <Card className="border-primary/15">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Name *</label>
                  <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                    <input type="tel" required value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(808) 555-1234" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email *</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Business Name (optional)</label>
                  <input value={form.businessName} onChange={(e) => setForm(f => ({ ...f, businessName: e.target.value }))} placeholder="Your business, if applicable" className={inputClass} />
                </div>

                {error && <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Apply to Become a Partner"}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center">
                  No fees. No commitments. We'll contact you within 24 hours to discuss the opportunity.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function ReferralPage() {
  useSEO({
    title: "Refer Businesses for Credit Card Processing | Earn Residual Income | TechSavvy Hawaii",
    description: "Earn residual monthly income by referring businesses to TechSavvy Hawaii. No selling, no experience needed. Just make introductions and get paid every month for as long as they process.",
    keywords: "referral partner program Hawaii, credit card processing referral, payment processing referrals, earn residual income card processing, refer businesses Hawaii, TechSavvy partner program",
    canonical: "https://techsavvyhawaii.com/refer",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      <ReferralHero />
      <StatsBar />
      <HowItWorks />
      <EarningsSection />
      <WhyPartnerSection />
      <WhoShouldRefer />
      <ApplyForm />
    </Layout>
  );
}
