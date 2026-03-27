import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star, ChevronDown, MapPin, DollarSign, Clock, ShieldCheck, Phone } from "lucide-react";
import { useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { useParams } from "wouter";

const industries: Record<string, {
  slug: string; name: string; title: string; painNumber: string; painLine: string;
  description: string; problems: string[]; benefits: string[];
  faq: { q: string; a: string }[];
  seo: { title: string; description: string; keywords: string };
}> = {
  restaurants: {
    slug: "restaurants",
    name: "Restaurants & Bars",
    title: "Hawaii Restaurants Lose $14,400/Year to Processing Fees",
    painNumber: "$14,400",
    painLine: "That's what the average Hawaii restaurant loses every year to credit card processing fees.",
    description: "Between dine-in, takeout, bar tabs, and tips — restaurants process more card transactions than almost any other business. At 2-4% per swipe, those fees add up to thousands every month that should be going to your staff, your kitchen, or your bottom line.",
    problems: [
      "High card volume means high fees — $800-$2,000+/month is typical",
      "Tip adjustments add hidden costs most owners never see",
      "POS system leases lock you into expensive multi-year contracts",
      "Processors raise rates quietly and hope you don't notice",
    ],
    benefits: [
      "Eliminate 100% of processing fees with our cash discount program",
      "Free POS terminal for qualifying restaurants ($10K+/month)",
      "Works with your existing menu pricing — we handle the signage",
      "Next-day deposits so you always have cash flow for supplies",
      "No contracts — leave anytime if you're not saving money",
      "Local Hawai'i support team that understands the restaurant industry",
    ],
    faq: [
      { q: "Will my customers complain about the surcharge?", a: "Most don't. Card surcharges are now standard at restaurants across Hawaii. The terminal shows the amount clearly before they confirm. Many customers simply switch to cash or don't even notice." },
      { q: "Does this work with tips?", a: "Yes. Tips are added after the surcharge is calculated, so your staff keeps 100% of tips with zero fees taken out." },
      { q: "What about online orders and delivery?", a: "We support online payment gateways, virtual terminals, and integration with ordering platforms. The cash discount model works for in-person transactions." },
    ],
    seo: {
      title: "Restaurant Credit Card Processing Hawaii | Zero Fees | TechSavvy",
      description: "Hawaii restaurants save $14,400/year by eliminating credit card processing fees. Free POS terminal, no contracts, local support. Cash discount program for restaurants, bars, and food service.",
      keywords: "restaurant credit card processing Hawaii, restaurant payment processing, zero fee restaurant POS, restaurant credit card fees Honolulu, food service card processing Hawaii, eliminate restaurant processing fees",
    },
  },
  "auto-shops": {
    slug: "auto-shops",
    name: "Auto Repair Shops",
    title: "Hawaii Auto Shops Lose $18,000/Year to Processing Fees",
    painNumber: "$18,000",
    painLine: "That's what the average Hawaii auto repair shop loses every year to credit card processing fees.",
    description: "Auto repair invoices are large — $500, $1,000, $2,000+ per ticket. At 3-4% per transaction, you're handing your processor $15-$80 on every single job. Over a year, that's a new lift or a full set of tools walking out the door.",
    problems: [
      "Large ticket sizes mean massive per-transaction fees",
      "A single $2,000 repair costs you $60-$80 in processing fees",
      "Most shops process $30K-$60K/month — that's $900-$2,400/month in fees",
      "Processors target auto shops because they know you're too busy to check",
    ],
    benefits: [
      "Eliminate 100% of processing fees — keep every dollar of every repair",
      "Free terminal for qualifying shops ($10K+/month volume)",
      "Works perfectly with large ticket sizes — the bigger the job, the more you save",
      "No contracts — try it risk-free",
      "Next-day funding so you can order parts without waiting",
      "Local Hawai'i team that comes to your shop for setup",
    ],
    faq: [
      { q: "Do customers push back on large-ticket surcharges?", a: "Rarely. A 3-4% surcharge on a $1,500 repair is $45-$60 — most customers understand that credit card companies charge fees. Many pay cash or don't mind. And you save $45-$60 on every single job." },
      { q: "Can I still offer payment plans?", a: "Yes. The cash discount program works alongside any financing or payment plan options you already offer." },
      { q: "What if I have multiple bays or locations?", a: "We can set up multiple terminals. Each one connects to the same merchant account with unified reporting." },
    ],
    seo: {
      title: "Auto Shop Credit Card Processing Hawaii | Zero Fees | TechSavvy",
      description: "Hawaii auto repair shops save $18,000/year by eliminating credit card processing fees. Free terminal, no contracts. Built for high-ticket automotive businesses.",
      keywords: "auto repair credit card processing Hawaii, auto shop payment processing, mechanic credit card fees Hawaii, automotive card processing Honolulu, auto shop POS system Hawaii",
    },
  },
  salons: {
    slug: "salons",
    name: "Salons & Spas",
    title: "Hawaii Salons Lose $7,200/Year to Processing Fees",
    painNumber: "$7,200",
    painLine: "That's what the average Hawaii salon or spa loses every year to credit card processing fees.",
    description: "Hair, nails, facials, massage — your clients almost always pay by card. At 2-4% per transaction, those fees eat into every appointment. That's money that should be going to your stylists, your products, or your expansion.",
    problems: [
      "Nearly 100% card payments means maximum fee exposure",
      "Tip adjustments add hidden processing costs",
      "Monthly POS software fees on top of processing fees",
      "Long contracts with cancellation penalties trap you with bad rates",
    ],
    benefits: [
      "Eliminate 100% of processing fees — keep every dollar from every appointment",
      "Free terminal for qualifying salons ($10K+/month)",
      "Works perfectly with appointment-based businesses",
      "Your stylists keep 100% of tips — zero fees deducted",
      "No contracts — switch back anytime with zero penalty",
      "Quick setup — most salons are live within a week",
    ],
    faq: [
      { q: "Will my salon clients mind the surcharge?", a: "Salons across Hawaii are already using this model. Most clients don't notice or simply pay cash for smaller services. Your regulars will understand — and you'll save hundreds every month." },
      { q: "Does it work with booking software?", a: "Yes. Our terminal works independently of your booking system. Clients book as usual, then pay at the terminal with the cash discount applied automatically." },
      { q: "What about retail product sales?", a: "Same system — whether it's a haircut or a bottle of shampoo, the cash discount applies to all card transactions." },
    ],
    seo: {
      title: "Salon Credit Card Processing Hawaii | Zero Fees | TechSavvy",
      description: "Hawaii salons and spas save $7,200/year by eliminating credit card processing fees. Free terminal, no contracts, tips protected. Built for beauty and wellness businesses.",
      keywords: "salon credit card processing Hawaii, spa payment processing, beauty shop credit card fees, salon card processing Honolulu, salon POS system Hawaii, nail salon payment processing",
    },
  },
};

export default function IndustryPage() {
  const params = useParams<{ industry: string }>();
  const industry = industries[params.industry || ""];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!industry) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Industry not found</h1>
            <a href="/" className="text-primary underline">Back to home</a>
          </div>
        </div>
      </Layout>
    );
  }

  useSEO({
    title: industry.seo.title,
    description: industry.seo.description,
    keywords: industry.seo.keywords,
    canonical: `https://techsavvyhawaii.com/industries/${industry.slug}`,
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/8 blur-[150px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-5 text-primary border-primary/30 bg-primary/5">
                <MapPin className="w-3 h-3 mr-1" />
                Built for Hawai'i {industry.name}
              </Badge>
            </motion.div>
            <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6" variants={fadeUp}>
              {industry.title.split(industry.painNumber)[0]}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">{industry.painNumber}/Year</span>
              {industry.title.split("/Year")[1]}
            </motion.h1>
            <motion.p className="text-base sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto" variants={fadeUp}>
              {industry.painLine}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
              <Button size="lg" className="text-base px-8 py-6 w-full sm:w-auto" asChild>
                <a href="/statement-review">
                  Get Your Free AI Analysis
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

      {/* The Problem */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-5">The problem for {industry.name.toLowerCase()}</h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">{industry.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {industry.problems.map((p) => (
                <Card key={p} className="border-red-500/15">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-xs font-bold">!</span>
                    </div>
                    <span className="text-sm text-foreground/80">{p}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-14 sm:py-20 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-5">How TechSavvy fixes this for {industry.name.toLowerCase()}</h2>
            <div className="space-y-3">
              {industry.benefits.map((b) => (
                <div key={b} className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{b}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <a href="/statement-review">
                  See How Much Your {industry.name.split(" ")[0]} Could Save
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">Questions from {industry.name.toLowerCase()} owners</h2>
          <div className="space-y-3">
            {industry.faq.map((faq, i) => (
              <Card key={i} className="border-border/50 overflow-hidden cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <CardContent className="p-0">
                  <button className="w-full p-5 flex items-center justify-between text-left">
                    <span className="font-bold text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Card className="border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
            <CardContent className="p-8 sm:p-12 relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                Stop losing {industry.painNumber}/year.
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Get a free AI-powered statement analysis and see exactly how much your {industry.name.toLowerCase().replace(/s$/, "")} is losing to processing fees.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="px-8" asChild>
                  <a href="/statement-review">
                    Free AI Statement Analysis
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="tel:8087675460">
                    <Phone className="w-4 h-4" />
                    Call (808) 767-5460
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
