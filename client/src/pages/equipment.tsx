import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import {
  Gift,
  Check,
  ArrowRight,
  Monitor,
  Smartphone,
  Wifi,
  CreditCard,
  Globe,
  Printer,
  Star,
  ShieldCheck,
  Sparkles,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useRef, useState } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";

// ─── Product Data ───────────────────────────────────────────────────────

type Product = {
  name: string;
  description: string;
  features: string[];
  monthlyRate?: string;
  price?: string;
  popular?: boolean;
  freeWithProgram?: boolean;
};

const TERMINALS: Product[] = [
  {
    name: "Valor VL550",
    description:
      "5.5\" touchscreen terminal with built-in printer. Ideal for countertop businesses — restaurants, retail, salons.",
    features: [
      "5.5\" HD touchscreen",
      "Built-in thermal printer",
      "Tap, chip & swipe",
      "Wi-Fi & Ethernet",
      "Cash discount ready",
    ],
    monthlyRate: "$40/mo",
    popular: true,
    freeWithProgram: true,
  },
  {
    name: "Valor VP550",
    description:
      "Android-powered smart POS terminal. Runs apps, manages inventory, and processes payments all in one device.",
    features: [
      "Android OS",
      "App marketplace",
      "Built-in camera & scanner",
      "4G + Wi-Fi",
      "Cash discount built-in",
    ],
    monthlyRate: "$40/mo",
    freeWithProgram: true,
  },
  {
    name: "PAX A920",
    description:
      "Portable smart terminal with 5\" touchscreen. Perfect for mobile businesses, food trucks, and delivery.",
    features: [
      "5\" touchscreen display",
      "Portable & wireless",
      "Built-in printer",
      "4G LTE + Wi-Fi + Bluetooth",
      "Long-lasting battery",
    ],
    price: "$379",
    monthlyRate: "$40/mo",
    freeWithProgram: true,
  },
  {
    name: "PAX A80",
    description:
      "Compact countertop terminal. Small footprint, big performance — great for tight spaces and quick transactions.",
    features: [
      "Compact countertop design",
      "Fast transaction speed",
      "Tap, chip & swipe",
      "Ethernet + Wi-Fi",
      "Built-in printer",
    ],
    price: "$265",
    monthlyRate: "$40/mo",
    freeWithProgram: true,
  },
  {
    name: "PAX A920 Pro",
    description:
      "Upgraded smart terminal with faster processor and larger battery. Built for high-volume businesses.",
    features: [
      "Enhanced performance",
      "Larger battery capacity",
      "5\" HD touchscreen",
      "All connectivity options",
      "Android apps supported",
    ],
    price: "$400",
    monthlyRate: "$40/mo",
    freeWithProgram: true,
  },
  {
    name: "FD150 Terminal",
    description:
      "Reliable, no-frills countertop terminal. Straightforward and dependable for everyday card acceptance.",
    features: [
      "Simple countertop setup",
      "Fast processing",
      "EMV chip & magnetic stripe",
      "Ethernet connected",
      "Built-in printer",
    ],
    monthlyRate: "$40/mo",
    freeWithProgram: true,
  },
];

const POS_SYSTEMS: Product[] = [
  {
    name: "Clover Flex",
    description:
      "Handheld POS with ~6\" touchscreen, built-in printer, camera scanner, and receipt printing. Take payments anywhere in your store.",
    features: [
      "6\" touchscreen",
      "Built-in printer & scanner",
      "Portable & wireless",
      "Clover app marketplace",
      "Inventory management",
      "Employee management",
    ],
    monthlyRate: "$73/mo",
    popular: true,
    freeWithProgram: true,
  },
  {
    name: "Clover Mini",
    description:
      "8\" touchscreen countertop POS. Compact but powerful — perfect for restaurants and retail shops that need a full POS experience.",
    features: [
      "8\" HD touchscreen",
      "Countertop design",
      "Full Clover app suite",
      "Built-in receipt printer",
      "Table management (restaurants)",
      "Customer-facing display option",
    ],
    monthlyRate: "$73/mo",
    freeWithProgram: true,
  },
  {
    name: "Clover Station Solo",
    description:
      "14\" HD touchscreen full POS station. The flagship Clover system — ideal for high-volume restaurants, bars, and retail stores.",
    features: [
      "14\" HD touchscreen",
      "Full POS workstation",
      "Cash drawer compatible",
      "Kitchen printer support",
      "Advanced reporting",
      "Multi-employee support",
    ],
    monthlyRate: "$145–$195/mo",
    popular: true,
    freeWithProgram: true,
  },
  {
    name: "KORONA POS Bundle",
    description:
      "Complete POS system bundle with touchscreen, cash drawer, and receipt printer. Ideal for retail and quick-service restaurants.",
    features: [
      "Full touchscreen POS",
      "Cash drawer included",
      "Receipt printer included",
      "Cloud-based management",
      "Real-time reporting",
      "Multi-location support",
    ],
    freeWithProgram: true,
  },
  {
    name: "KORONA Dual-Screen POS",
    description:
      "Dual-screen POS system with customer-facing display. Perfect for retail environments where customers want to see their order.",
    features: [
      "Dual-screen setup",
      "Customer-facing display",
      "Touch interface",
      "Inventory tracking",
      "Loyalty program built-in",
      "Cloud reporting",
    ],
    freeWithProgram: true,
  },
];

const GATEWAYS: Product[] = [
  {
    name: "NMI Gateway",
    description:
      "Industry-leading payment gateway for e-commerce and online businesses. Accept payments on your website with secure tokenization.",
    features: [
      "Online payment acceptance",
      "Recurring billing",
      "Virtual terminal",
      "Tokenization & security",
      "Developer-friendly API",
      "Shopping cart integrations",
    ],
    freeWithProgram: true,
  },
  {
    name: "Valor Gateway",
    description:
      "Full-featured payment gateway with cash discount support. Manage online and in-store payments from one dashboard.",
    features: [
      "Cash discount compatible",
      "Unified dashboard",
      "Invoice management",
      "Recurring payments",
      "Multi-location support",
      "Real-time reporting",
    ],
    freeWithProgram: true,
  },
];

const CATEGORIES = [
  {
    id: "terminals",
    label: "Terminals",
    icon: CreditCard,
    description: "Countertop & wireless card readers",
    products: TERMINALS,
  },
  {
    id: "pos",
    label: "POS Systems",
    icon: Monitor,
    description: "Full point-of-sale solutions",
    products: POS_SYSTEMS,
  },
  {
    id: "gateways",
    label: "Gateways",
    icon: Globe,
    description: "Online & e-commerce payments",
    products: GATEWAYS,
  },
];

// ─── Components ─────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group relative overflow-hidden">
        {product.popular && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground text-[10px]">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          </div>
        )}
        {product.freeWithProgram && (
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
            >
              <Gift className="w-3 h-3 mr-1" />
              Free with program
            </Badge>
          </div>
        )}

        <CardContent className="p-6 pt-12 flex flex-col h-full">
          <h3 className="text-lg font-bold mb-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-2 mb-6 flex-1">
            {product.features.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-xs text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-4 mt-auto">
            {product.monthlyRate && (
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-lg font-bold text-primary">
                  {product.monthlyRate}
                </span>
                {product.price && (
                  <span className="text-xs text-muted-foreground">
                    or {product.price} to own
                  </span>
                )}
              </div>
            )}
            <Button size="sm" className="w-full" asChild>
              <Link href="/apply">
                Get This Free
                <Gift className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function EquipmentPage() {
  useSEO({
    title:
      "Free POS Terminals & Equipment | Card Processing Machines | TechSavvy Hawaii",
    description:
      "Get free POS terminals, Clover systems, card readers, and payment gateways with our cash discount program. Zero fees, free equipment — our gift to Hawaii businesses.",
    keywords:
      "free POS terminal Hawaii, free credit card machine, Clover POS Hawaii, payment terminal, card reader Hawaii, point of sale system, free card processing equipment, PAX terminal, Valor terminal, NMI gateway, cash discount terminal",
    canonical: "https://techsavvyhawaii.com/equipment",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Free POS Terminals & Equipment — TechSavvy Hawaii",
      url: "https://techsavvyhawaii.com/equipment",
      description:
        "Browse free POS terminals, Clover systems, and payment gateways available through our cash discount program in Hawaii.",
      isPartOf: { "@id": "https://techsavvyhawaii.com/#website" },
    },
  });

  const [activeCategory, setActiveCategory] = useState("terminals");
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="mb-4 text-primary border-primary/30 bg-primary/5"
              >
                <Gift className="w-3 h-3 mr-1.5" />
                Free equipment with our cash discount program
              </Badge>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-4"
              variants={fadeUp}
            >
              Your New Equipment —{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                On Us
              </span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6"
              variants={fadeUp}
            >
              When you join our cash discount program, we don't just eliminate
              your processing fees — we give you the equipment to do it. Browse
              our terminals, POS systems, and gateways below.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-2"
              variants={fadeUp}
            >
              {[
                { icon: Gift, text: "Free terminal or POS" },
                { icon: Sparkles, text: "Zero processing fees" },
                { icon: ShieldCheck, text: "100% compliant program" },
              ].map((p) => (
                <div
                  key={p.text}
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <p.icon className="w-4 h-4 text-primary" />
                  <span>{p.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Tab bar */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-muted/50 rounded-xl p-1.5 gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-background shadow-md text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category description */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {activeCat.label}
            </h2>
            <p className="text-muted-foreground">{activeCat.description}</p>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCat.products.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Mini */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              How You Get Your Free Equipment
            </h2>
            <p className="text-muted-foreground">
              Three simple steps — we handle the rest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Apply Online",
                description:
                  "Fill out the merchant agreement. Takes about 5 minutes.",
                icon: Smartphone,
              },
              {
                step: "2",
                title: "Get Approved",
                description:
                  "We review your application and approve within 24–48 hours.",
                icon: ShieldCheck,
              },
              {
                step: "3",
                title: "Receive Your Gift",
                description:
                  "We ship your free terminal and set up your cash discount program. Start saving immediately.",
                icon: Gift,
              },
            ].map((s) => (
              <Card key={s.step} className="border-border/50 text-center">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-bold text-primary">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 p-8 sm:p-12 text-center">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Ready to Unwrap Your Savings?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Apply now and receive your free equipment, zero processing fees,
              and a compliant cash discount program — all at no cost to you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/apply">
                  <Gift className="w-4 h-4" />
                  Claim Your Free Equipment
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="tel:+18087675460">
                  <Phone className="w-4 h-4" />
                  Call (808) 767-5460
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
