import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, HelpCircle, Phone } from "lucide-react";
import { useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";

function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
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
    </div>
  );
}

export default function FaqPage() {
  useSEO({
    title: "Credit Card Processing FAQ | Payment Processing Questions | TechSavvy Hawaii",
    description: "Get answers about credit card processing, cash discount programs, payment processing fees, and merchant services in Hawaii. Learn how to eliminate card processing fees for your business.",
    keywords: "credit card processing FAQ Hawaii, payment processing questions, cash discount program FAQ, how to eliminate credit card fees, card processing questions Hawaii, merchant services FAQ, credit card fees explained, payment processor FAQ Hawaii",
    canonical: "https://techsavvyhawaii.com/faq",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": "Credit Card Processing & Payment Processing FAQ — TechSavvy Hawaii",
      "url": "https://techsavvyhawaii.com/faq",
      "description": "Frequently asked questions about credit card processing fees, cash discount programs, and payment processing for Hawaii businesses.",
      "isPartOf": { "@id": "https://techsavvyhawaii.com/#website" },
    },
  });

  const generalFAQs = [
    { q: "How much can I save with TechSavvy?", a: "With our Cash Back program, you can eliminate up to 100% of processing fees. The average Hawaii business saves $800–$2,000+ per month. We'll show you your exact savings with a free statement analysis." },
    { q: "How does Cash Back work?", a: "We set up your system to offer a cash price and a card price. Card-paying customers see a small surcharge (typically 3–4%) added at the terminal before they confirm. Cash customers pay the listed price. The merchant keeps 100% of every transaction — card or cash." },
    { q: "Is Cash Back legal in Hawaii?", a: "Yes — 100% legal in Hawaii and all 50 states. The FTC and all major card networks (Visa, Mastercard, Amex, Discover) allow surcharges when properly disclosed. TechSavvy handles all required signage and compliance for you." },
    { q: "Will my customers mind the surcharge?", a: "Most don't. Card surcharges are now mainstream — gas stations, restaurants, and retailers all do it. The terminal shows the amount clearly before the customer confirms. Many customers won't even notice or will simply pay with cash." },
    { q: "What kind of businesses do you work with?", a: "We serve restaurants, retail stores, auto repair shops, salons, medical offices, service providers, food trucks, and more — anyone who processes card payments. We also work with high-risk merchants (CBD, vape, firearms, gaming, nutraceuticals)." },
  ];

  const pricingFAQs = [
    { q: "Are there any contracts or sign-up fees?", a: "Nope! No contracts, no sign-up fees, no hidden costs. Just simple, transparent pricing. You can cancel anytime with zero penalties." },
    { q: "How do I qualify for a free terminal?", a: "If you process $5,000+ per month in card transactions and enroll in our Cash Back program, you qualify for a free terminal. We ship it to you and handle the full setup." },
    { q: "Are there any monthly fees?", a: "No. TechSavvy charges zero monthly fees — no statement fees, no PCI fees, no gateway fees, no batch fees. Your ongoing cost with us is $0." },
    { q: "What about interchange fees — don't I still pay those?", a: "With Cash Back, the surcharge covers the interchange and processing costs entirely. You keep 100% of your sale amount. That's the whole point — zero fees to you." },
    { q: "What if I want to leave TechSavvy?", a: "No problem. There's no contract and no cancellation fee. You can leave anytime with zero penalty. We keep merchants by delivering value, not by trapping them." },
  ];

  const setupFAQs = [
    { q: "How long does it take to get set up?", a: "Most businesses are fully operational within 3–7 days after approval. Our local team handles the entire setup — terminal programming, signage, and staff training." },
    { q: "What equipment do I need?", a: "We provide a countertop terminal that accepts chip, swipe, and contactless/NFC payments (Apple Pay, Google Pay, etc.). If you need mobile or POS solutions, we have those too." },
    { q: "Do I need to change my bank account?", a: "No. We deposit directly into your existing business bank account. Next-day funding is available for most merchants." },
    { q: "What happens if my terminal breaks or has issues?", a: "Contact our local Hawaii support team. We'll troubleshoot remotely or replace the terminal at no cost. We provide 24/7 support." },
    { q: "Can I accept online payments too?", a: "Yes. We offer online payment gateways, virtual terminals, invoicing, and payment links in addition to in-store terminals." },
  ];

  const highRiskFAQs = [
    { q: "What is a high-risk merchant?", a: "Certain industries are considered 'high-risk' by banks due to higher chargeback rates or regulatory scrutiny. This includes CBD, vape, firearms, gaming, nutraceuticals, adult entertainment, and some e-commerce categories." },
    { q: "Does TechSavvy work with high-risk merchants?", a: "Yes. We specialize in high-risk merchant accounts and offer the same zero-fee processing with fast approvals. Visit our High-Risk page or contact us for details." },
    { q: "Are rates different for high-risk accounts?", a: "High-risk accounts may have slightly different terms, but we still eliminate or drastically reduce your processing costs compared to traditional high-risk processors. We'll show you exact numbers in your free analysis." },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-10 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
                <HelpCircle className="w-3 h-3 mr-1" />
                Frequently Asked Questions
              </Badge>
            </motion.div>
            <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5" variants={fadeUp}>
              Frequently Asked{" "}
              <span className="text-primary">Questions...</span>
            </motion.h1>
            <motion.p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto" variants={fadeUp}>
              Everything you need to know about TechSavvy's zero-fee payment processing, Cash Back, and how we help Hawaii businesses keep more of what they earn.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-12 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-5">General Questions</h2>
            <FAQAccordion items={generalFAQs} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-5">Pricing & Fees</h2>
            <FAQAccordion items={pricingFAQs} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-5">Setup & Equipment</h2>
            <FAQAccordion items={setupFAQs} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-5">High-Risk Merchants</h2>
            <FAQAccordion items={highRiskFAQs} />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-primary/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
              <CardContent className="p-8 sm:p-12 relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Still Have Questions?</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Our local Hawaii team is here to help. Call us, or get a free savings analysis — no obligation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button size="lg" asChild>
                    <Link href="/contact">
                      Get Your Free Analysis
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
