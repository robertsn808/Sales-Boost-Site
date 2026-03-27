import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  ArrowRight,
  Check,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { useMemo } from "react";
import { fadeUp, staggerContainer, scaleIn } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

function HighRiskHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-36 sm:pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-chart-2/8 via-chart-2/3 to-transparent" />
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-chart-2/10 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex flex-wrap items-center justify-center gap-3" variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-chart-2 border-chart-2/30 bg-chart-2/5">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              High-Risk Merchants Welcome
            </Badge>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Serving All of Hawai'i
            </Badge>
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-6"
            variants={fadeUp}
          >
            High-Risk{" "}
            <span className="bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
              Payment Processing
            </span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto"
            variants={fadeUp}
          >
            Turned down by other processors? We specialize in high-risk merchant accounts with zero-fee processing.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
            <Button size="lg" asChild>
              <Link href="/contact">
                Apply for High-Risk Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">
                See Pricing
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HighRiskDetailsSection() {
  const industries = [
    "CBD & Hemp",
    "Vape & E-Cigarette",
    "Firearms & Ammunition",
    "Nutraceuticals",
    "Travel & Tourism",
    "Debt Collection",
    "Online Gaming",
    "Adult Entertainment",
    "Subscription Services",
    "Tech Support",
    "Telemarketing",
    "E-Commerce",
  ];

  return (
    <section className="py-12 sm:py-24 relative" data-testid="section-high-risk">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full overflow-visible border-chart-2/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-chart-2/5 to-transparent" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-md bg-chart-2/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-chart-2" />
                  </div>
                  <CardTitle className="text-lg">Why Merchants Choose Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                {[
                  "No application denials based on industry type",
                  "Same zero processing fees as standard merchants",
                  "No reserve requirements or fund holds",
                  "Fast approval — often same-day setup",
                  "Dedicated support for high-risk industries",
                  "Chargeback prevention tools included",
                  "PCI-compliant secure transactions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full overflow-visible border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Industries We Serve</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <Badge
                      key={industry}
                      variant="outline"
                      className="text-muted-foreground border-border/60"
                      data-testid={`badge-industry-${industry.toLowerCase().replace(/[\s&]/g, "-")}`}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
                  Don't see your industry? Contact us — we work with nearly every business type that other processors reject.
                </p>
                <Button className="w-full mt-5" asChild>
                  <Link href="/contact" data-testid="link-high-risk-apply">
                    Apply for High-Risk Account
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function HighRiskPage() {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "High-Risk Merchant Account & Payment Processing — Zero Fees",
    "description": "High-risk merchant accounts with zero-fee payment processing. CBD, vape, firearms, nutraceuticals, travel, gaming & more. Fast approvals, no excessive reserves.",
    "url": "https://techsavvyhawaii.com/high-risk",
    "mainEntity": { "@id": "https://techsavvyhawaii.com/#high-risk" }
  }), []);

  useSEO({
    title: "High-Risk Credit Card Processing | Zero Fees | TechSavvy Hawaii",
    description: "High-risk merchant accounts with zero-fee payment processing. CBD, vape, firearms, nutraceuticals, supplements, travel, online gaming, adult entertainment & more. Fast approvals, no excessive reserves, no hidden fees, no contracts. Accept all major credit & debit cards.",
    keywords: "high risk credit card processing Hawaii, high risk payment processing Hawaii, high risk merchant account, high risk payment processor, high risk merchant services, CBD payment processing, CBD merchant account, vape merchant account, vape payment processing, firearms payment processing, firearms merchant account, nutraceuticals merchant account, adult merchant account, online gaming payment processing, travel merchant account, supplement merchant account, e-cigarette merchant account, high risk credit card processing, cannabis payment processing, Delta-8 merchant account, subscription box payment processing",
    canonical: "https://techsavvyhawaii.com/high-risk",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
    ogTitle: "High-Risk Merchant Accounts — Zero-Fee Processing | TechSavvy Hawaii",
    ogDescription: "CBD, vape, firearms, nutraceuticals & more. Zero processing fees, fast approvals, no excessive reserves, no contracts. High-risk specialists.",
    twitterTitle: "High-Risk Merchant Accounts — Zero Fees | TechSavvy Hawaii",
    twitterDescription: "CBD, vape, firearms & more. Zero processing fees, fast approvals, no reserves, no contracts. High-risk payment processing specialists.",
    jsonLd,
  });

  return (
    <Layout>
      <HighRiskHero />
      <HighRiskDetailsSection />
    </Layout>
  );
}
