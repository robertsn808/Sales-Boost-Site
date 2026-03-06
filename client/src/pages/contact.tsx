import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  CreditCard,
  Settings,
  Shield,
  Globe,
  HelpCircle,
  Star,
  Users,
  TrendingUp,
  ThumbsUp,
  Quote,
  Gift,
} from "lucide-react";
import { useState, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

type FAQCategory = "all" | "processing" | "pricing" | "setup" | "surcharge" | "websites" | "hawaii";

interface FAQ {
  q: string;
  a: string;
  category: FAQCategory;
}

const faqs: FAQ[] = [
  {
    q: "How does zero-fee payment processing work?",
    a: "Instead of the merchant paying 2-4% processing fees on every sale, a small surcharge is passed to the customer at checkout. The merchant keeps 100% of the sale amount \u2014 deposited into their account by the next business day, with no deductions.",
    category: "processing",
  },
  {
    q: "What does the terminal include?",
    a: "Your terminal accepts chip, swipe, and contactless/NFC tap payments, plus online payment gateway access. Full setup, programming, training, compliance signage, and a free statement analysis are all included.",
    category: "setup",
  },
  {
    q: "What are the pricing options?",
    a: "It's simple: $0 processing fees, $0 monthly fees, no contracts. Qualifying businesses ($10K+/month) get a free terminal. We set everything up at no cost. Your ongoing cost with TechSavvy is $0.",
    category: "pricing",
  },
  {
    q: "Are there any monthly fees or contracts?",
    a: "No. There are zero monthly fees, zero contracts, and zero commitments. Your ongoing cost with TechSavvy is $0.",
    category: "pricing",
  },
  {
    q: "How long does setup take?",
    a: "Setup can be completed the same day. We configure your terminal, connect it to your bank, and train you on how to use it so you can start accepting payments immediately.",
    category: "setup",
  },
  {
    q: "When do I receive my funds?",
    a: "Funds are deposited to your bank account by the next business day. You can track all deposits and transactions through your real-time dashboard.",
    category: "processing",
  },
  {
    q: "Do you accept high-risk merchants?",
    a: "Yes. We specialize in high-risk merchant accounts including CBD, vape, firearms, nutraceuticals, travel, online gaming, adult entertainment, and more. Same zero-fee processing, no excessive reserves, and fast approvals.",
    category: "processing",
  },
  {
    q: "Won't customers be upset about the surcharge?",
    a: "Most businesses are surprised by how smoothly it goes. About 90% of customers already pay by card and expect the listed price. Gas stations have done this for decades. We also help you frame it as a 'cash discount' \u2014 rewarding cash payers \u2014 which customers respond to positively. Professional signage we provide makes it feel standard.",
    category: "surcharge",
  },
  {
    q: "How does the cash discount program work?",
    a: "We set up your terminal to show two prices: a cash price and a card price. Card-paying customers see a small surcharge (3-4%) shown clearly before they confirm. Cash customers pay the listed price. You keep 100% of every sale either way. It's fully legal and compliant with Visa, Mastercard, and FTC rules. We handle all signage and compliance.",
    category: "pricing",
  },
  {
    q: "Do I need a minimum sales volume?",
    a: "Yes \u2014 we require a minimum of $5,000-$10,000 in monthly processing volume to qualify. This ensures the zero-fee model delivers meaningful savings for your business.",
    category: "processing",
  },
  {
    q: "Does TechSavvy offer website design for Hawai'i businesses?",
    a: "TechSavvy offers web design services for merchants who need an online presence. We also offer premium website packages with e-commerce integration, online ordering, booking systems, and custom software. All websites are mobile-optimized, SEO-ready, and built to help your Hawai'i business get found online.",
    category: "websites",
  },
  {
    q: "What areas in Hawai'i does TechSavvy serve?",
    a: "We serve businesses across all Hawaiian Islands \u2014 O'ahu (Honolulu, Kailua, Pearl City), Maui (Kahului, Lahaina, Kihei), the Big Island (Kona, Hilo), Kaua'i, Moloka'i, and Lana'i. We offer same-day setup with remote training, and on-site support is available in the Honolulu area.",
    category: "hawaii",
  },
  {
    q: "Is the surcharge legal in Hawai'i?",
    a: "Yes. Surcharging is legal in Hawai'i and fully compliant with Visa and Mastercard rules. We handle all the compliance requirements \u2014 signage, receipt disclosures, and card brand registration \u2014 so your business is always in the clear.",
    category: "surcharge",
  },
];

const categories: { id: FAQCategory; label: string; icon: typeof HelpCircle }[] = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "processing", label: "Processing", icon: CreditCard },
  { id: "pricing", label: "Pricing & Plans", icon: TrendingUp },
  { id: "setup", label: "Setup", icon: Settings },
  { id: "surcharge", label: "Surcharge", icon: Shield },
  { id: "websites", label: "Websites", icon: Globe },
  { id: "hawaii", label: "Hawai'i", icon: MapPin },
];

function FAQHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-6 sm:pt-36 sm:pb-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-5 text-primary border-primary/30 bg-primary/5">
              <HelpCircle className="w-3 h-3 mr-1.5" />
              FAQ
            </Badge>
          </motion.div>
          <motion.h1
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-5"
            variants={fadeUp}
            data-testid="text-faq-title"
          >
            Got Questions?{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              We've Got Answers
            </span>
          </motion.h1>
          <motion.p
            className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            variants={fadeUp}
          >
            Everything you need to know about zero-fee payment processing, Cash Back, and how TechSavvy helps Hawai'i businesses thrive.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (activeCategory !== "all") {
      result = result.filter((f) => f.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  return (
    <section className="py-6 sm:py-12 relative" data-testid="section-faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenIndex(null);
            }}
            placeholder="Search questions..."
            className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            data-testid="input-faq-search"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover-elevate"
                }`}
                data-testid={`button-faq-category-${cat.id}`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key={activeCategory + searchQuery}
        >
          {filteredFaqs.length === 0 ? (
            <motion.div variants={fadeUp} className="text-center py-10">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No questions match your search. Try a different term or category.</p>
            </motion.div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const globalIndex = faqs.indexOf(faq);
              const isOpen = openIndex === globalIndex;
              return (
                <motion.div key={globalIndex} variants={fadeUp}>
                  <Card
                    className="overflow-visible cursor-pointer hover-elevate border-primary/5"
                    onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                    data-testid={`button-faq-${globalIndex}`}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            {(() => {
                              const cat = categories.find((c) => c.id === faq.category);
                              const Icon = cat?.icon || HelpCircle;
                              return <Icon className="w-3.5 h-3.5 text-primary" />;
                            })()}
                          </div>
                          <h3 className="font-semibold text-sm sm:text-base text-foreground" data-testid={`text-faq-q-${globalIndex}`}>
                            {faq.q}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-primary shrink-0 mt-1 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isOpen && (
                        <motion.div
                          className="ml-10 mt-3 pt-3 border-t border-border/50"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                        >
                          <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`text-faq-a-${globalIndex}`}>
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/connect" data-testid="link-faq-chat">
                Chat With Us
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <a href="tel:+18087675460" data-testid="link-faq-call">
                <Phone className="w-3 h-3" />
                Call (808) 767-5460
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SurchargeAcceptanceSection() {
  const stats = [
    { value: "90%", label: "of customers pay by card already", icon: CreditCard },
    { value: "95%", label: "merchant retention after trial", icon: ThumbsUp },
    { value: "$0", label: "in processing fees, ever", icon: TrendingUp },
    { value: "24hr", label: "next-day deposits to your bank", icon: Clock },
  ];

  return (
    <section className="py-14 sm:py-20 relative" data-testid="section-surcharge-acceptance">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <Users className="w-3 h-3 mr-1.5" />
              Real Talk
            </Badge>
          </motion.div>
          <motion.h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4"
            variants={fadeUp}
            data-testid="text-acceptance-title"
          >
            "Will My Customers Accept This?"
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
            variants={fadeUp}
          >
            This is the number one concern we hear. Here's what actually happens when businesses make the switch.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="overflow-visible border-primary/10 text-center">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1" data-testid={`text-stat-value-${i}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp}>
            <Card className="h-full overflow-visible border-primary/10">
              <CardContent className="p-5 sm:p-6">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">The Gas Station Principle</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gas stations have offered cash discounts for decades. Customers are already used to seeing slightly different prices for cash vs. card. We apply the same proven model to your business with full compliance signage.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full overflow-visible border-primary/10">
              <CardContent className="p-5 sm:p-6">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Professional Signage Included</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We provide professional, compliance-ready signage that frames it as a "cash discount." This positive framing makes customers feel rewarded for paying cash, rather than penalized for using a card.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full overflow-visible border-primary/10">
              <CardContent className="p-5 sm:p-6">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Most Customers Don't Notice</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The average surcharge is 3-4% \u2014 about $1.50 on a $50 purchase. Most customers don't even register it, and those who do understand it's standard practice. Complaints are extremely rare.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const reviews = [
    {
      name: "Mike K.",
      business: "Kona Coffee Co.",
      location: "Kailua-Kona, HI",
      text: "I was nervous about the surcharge at first, but after two weeks I realized none of my customers cared. I'm saving over $2,000 a month now. Best business decision I've made.",
      rating: 5,
    },
    {
      name: "Sarah L.",
      business: "Island Beauty Lounge",
      location: "Honolulu, HI",
      text: "TechSavvy set everything up in one afternoon. I started saving money from day one and the whole process was seamless. Can't believe there are no monthly fees.",
      rating: 5,
    },
    {
      name: "James T.",
      business: "Pacific Auto Repair",
      location: "Pearl City, HI",
      text: "I switched from my old processor after seeing their fees climb to 3.5%. Now I keep 100% of every transaction. The terminal is fast and reliable \u2014 my guys love it.",
      rating: 5,
    },
    {
      name: "Lisa M.",
      business: "Maui Wellness CBD",
      location: "Kahului, HI",
      text: "As a high-risk merchant, I was turned down by three processors before finding TechSavvy. They got me approved in 48 hours with zero reserves. Finally a company that works with us, not against us.",
      rating: 5,
    },
  ];

  return (
    <section className="py-14 sm:py-20 relative" data-testid="section-testimonials">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <Star className="w-3 h-3 mr-1.5" />
              Customer Stories
            </Badge>
          </motion.div>
          <motion.h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3"
            variants={fadeUp}
          >
            Hear From Our Merchants
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto"
            variants={fadeUp}
          >
            Real Hawai'i business owners share their experience with TechSavvy.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {reviews.map((review, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="h-full overflow-visible border-primary/10" data-testid={`card-review-${i}`}>
                <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                  <Quote className="w-6 h-6 text-primary/30 mb-3" />
                  <p className="text-sm text-foreground/85 leading-relaxed flex-1 mb-4" data-testid={`text-review-${i}`}>
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.business} \u2014 {review.location}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    monthlyVolume: "",
    interest: "bundle-terminal",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pkgMap: Record<string, string> = {
        "bundle-terminal": "terminal",
        "bundle-trial": "trial",
        "online-only": "online",
        "high-risk": "high-risk",
        "online-store": "online-store",
        "questions": "questions",
      };
      await apiRequest("POST", "/api/leads/public", {
        name: formData.name,
        business: formData.businessName,
        phone: formData.phone,
        email: formData.email,
        package: pkgMap[formData.interest] || "terminal",
        status: "new",
        notes: [
          formData.businessType && `Type: ${formData.businessType}`,
          formData.monthlyVolume && `Volume: ${formData.monthlyVolume}`,
          formData.message,
        ].filter(Boolean).join(" | "),
      });
    } catch {
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-14 sm:py-20 relative" data-testid="section-contact">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div className="flex flex-wrap items-center justify-center gap-3" variants={fadeUp}>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Free \u2014 No Commitment
            </Badge>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Honolulu, HI
            </Badge>
          </motion.div>
          <motion.h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4"
            variants={fadeUp}
            data-testid="text-contact-title"
          >
            Get Your Free{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              Savings Analysis
            </span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
            variants={fadeUp}
          >
            Tell us about your business and we'll show you exactly how much you can save on payment processing fees. No strings attached.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.a
            href="tel:+18087675460"
            className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50 hover:border-primary/30 transition-colors"
            variants={fadeUp}
            data-testid="link-contact-phone"
          >
            <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Call Us</div>
              <div className="text-sm font-semibold text-foreground">(808) 767-5460</div>
            </div>
          </motion.a>
          <motion.a
            href="mailto:contact@techsavvyhawaii.com"
            className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50 hover:border-primary/30 transition-colors"
            variants={fadeUp}
            data-testid="link-contact-email"
          >
            <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email Us</div>
              <div className="text-sm font-semibold text-foreground">contact@techsavvyhawaii.com</div>
            </div>
          </motion.a>
          <motion.div
            className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50"
            variants={fadeUp}
            data-testid="text-contact-hours"
          >
            <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Business Hours</div>
              <div className="text-sm font-semibold text-foreground">Mon - Fri</div>
              <div className="text-xs text-muted-foreground">8 AM - 5 PM HST</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-visible border-primary/10">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
            <CardContent className="p-7 sm:p-10 relative">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3" data-testid="text-contact-success">
                    Your Savings Analysis Is On the Way!
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're preparing your personalized processing savings analysis. Our team will reach out within a few hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-contact">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="John Doe"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Your Business LLC"
                        data-testid="input-contact-business"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="john@business.com"
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="(808) 555-1234"
                        data-testid="input-contact-phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Business Type *
                      </label>
                      <select
                        required
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        data-testid="select-contact-type"
                      >
                        <option value="">Select type...</option>
                        <option value="restaurant">Restaurant / Food Service</option>
                        <option value="retail">Retail Store</option>
                        <option value="salon">Salon / Beauty</option>
                        <option value="auto">Auto / Repair</option>
                        <option value="professional">Professional Services</option>
                        <option value="ecommerce">E-Commerce / Online-Only</option>
                        <option value="cbd-vape">CBD / Vape / High-Risk</option>
                        <option value="tourism">Tourism / Travel</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Monthly Sales Volume
                      </label>
                      <select
                        value={formData.monthlyVolume}
                        onChange={(e) => setFormData({ ...formData, monthlyVolume: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        data-testid="select-contact-volume"
                      >
                        <option value="">Select volume...</option>
                        <option value="under-5k">Under $5,000</option>
                        <option value="5k-10k">$5,000 - $10,000</option>
                        <option value="10k-25k">$10,000 - $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="100k+">$100,000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      I'm Interested In
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      data-testid="select-contact-interest"
                    >
                      <option value="bundle-terminal">Zero-Fee Processing</option>
                      <option value="high-risk">High-Risk Merchant Account</option>
                      <option value="online-store">Online Payment Gateway</option>
                      <option value="questions">Just Have Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Tell Us About Your Business
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      placeholder="Tell us about your business, what you're looking for, or any questions you have..."
                      data-testid="input-contact-message"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="button-contact-submit">
                    {submitting ? "Submitting..." : "Get My Free Savings Analysis"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>100% free — no commitment</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>Savings analysis included</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>Response within a few hours</span>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral CTA */}
        <motion.div
          className="text-center mt-8 py-6 border-t border-border/30"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Don't have a business but know one that could benefit?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Refer a local business and help them save thousands on processing fees.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/refer">
              Refer a Business
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default function ContactPage() {
  useSEO({
    title: "Contact TechSavvy Hawaii | Free Quote & Website Mockup",
    description: "Contact TechSavvy Hawaii for a free savings analysis on your payment processing. Zero-fee terminals, Cash Back, and high-risk accounts. Serving all Hawaiian Islands.",
    keywords: "contact TechSavvy Hawaii, free payment processing quote, merchant services Hawaii, Honolulu payment processor, Cash Back Hawaii",
    canonical: "https://techsavvyhawaii.com/contact",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      <ContactSection />
      <SurchargeAcceptanceSection />
      <TestimonialsSection />
    </Layout>
  );
}
