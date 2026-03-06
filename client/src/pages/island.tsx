import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, ArrowRight, MapPin, Phone, Star } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { useParams } from "wouter";

const islands: Record<string, {
  slug: string; name: string; fullName: string; businesses: string[];
  description: string; testimonial: { quote: string; name: string; biz: string };
  seo: { title: string; description: string; keywords: string };
}> = {
  oahu: {
    slug: "oahu", name: "O'ahu", fullName: "O'ahu & Honolulu",
    businesses: ["Waikiki restaurants & bars", "Kailua retail shops", "Pearl City auto repair", "Ala Moana salons & spas", "Chinatown food vendors", "Kapolei medical offices"],
    description: "O'ahu is home to over 30,000 small businesses — from Waikiki tourist spots to local Kailua shops. Most are paying 2-4% on every card transaction without realizing how much it adds up. TechSavvy is headquartered right here in Honolulu at 1917 S King St. We're your neighbors, and we're saving O'ahu businesses thousands every year.",
    testimonial: { quote: "We were losing over $1,200/month and had no idea. TechSavvy showed us the numbers and had us set up in less than a week.", name: "Restaurant Owner", biz: "Waikiki" },
    seo: {
      title: "Payment Processing O'ahu & Honolulu | Zero Fees | TechSavvy Hawaii",
      description: "O'ahu businesses save $500-$3,000+/month with TechSavvy's zero-fee payment processing. Local Honolulu company, free equipment, no contracts. Serving Waikiki, Kailua, Pearl City & all of O'ahu.",
      keywords: "payment processing Oahu, merchant services Honolulu, zero fee credit card Waikiki, POS terminal Kailua, business payment processing Pearl City",
    },
  },
  maui: {
    slug: "maui", name: "Maui", fullName: "Maui County",
    businesses: ["Lahaina restaurants & shops", "Kihei retail & surf shops", "Wailuku auto services", "Paia salons & wellness", "Kahului food trucks", "Wailea resort vendors"],
    description: "Maui's small businesses are the backbone of the island — from Lahaina's Front Street to Kihei's beach shops. Tourist-heavy businesses process a massive volume of card transactions, and every swipe costs you 2-4%. TechSavvy serves Maui businesses with the same local support and zero-fee processing we bring to O'ahu.",
    testimonial: { quote: "Switching was the easiest business decision we made. No more monthly fees bleeding us dry during slow season.", name: "Retail Shop Owner", biz: "Kihei" },
    seo: {
      title: "Payment Processing Maui | Zero Fees | TechSavvy Hawaii",
      description: "Maui businesses save $500-$3,000+/month with TechSavvy's zero-fee payment processing. Free equipment, no contracts. Serving Lahaina, Kihei, Kahului, Wailuku & all of Maui.",
      keywords: "payment processing Maui, merchant services Lahaina, zero fee credit card Kihei, POS terminal Kahului, Maui business payment processing",
    },
  },
  "big-island": {
    slug: "big-island", name: "Big Island", fullName: "Hawai'i Island (Kona & Hilo)",
    businesses: ["Kona coffee shops & restaurants", "Hilo retail stores", "Kailua-Kona auto repair", "Volcano area tourism businesses", "Waimea ranching & ag services", "Captain Cook food vendors"],
    description: "From Kona's coffee country to Hilo's historic downtown, Big Island businesses process thousands in card transactions every month. The fees add up fast — especially for tourism-dependent businesses in Kona. TechSavvy brings zero-fee processing to the Big Island with the same local support and free equipment.",
    testimonial: { quote: "TechSavvy saved us over $900/month. That's real money for a small Kona coffee shop.", name: "Coffee Shop Owner", biz: "Kailua-Kona" },
    seo: {
      title: "Payment Processing Big Island | Kona & Hilo | Zero Fees | TechSavvy",
      description: "Big Island businesses save $500-$3,000+/month with TechSavvy's zero-fee payment processing. Free equipment, no contracts. Serving Kona, Hilo, Waimea & all of Hawai'i Island.",
      keywords: "payment processing Big Island Hawaii, merchant services Kona, zero fee credit card Hilo, POS terminal Kailua-Kona, Big Island business payments",
    },
  },
  kauai: {
    slug: "kauai", name: "Kaua'i", fullName: "Kaua'i",
    businesses: ["Poipu restaurants & resorts", "Kapaa retail shops", "Lihue auto services", "Princeville tourism businesses", "Hanapepe art galleries", "Koloa food trucks & cafes"],
    description: "Kaua'i's Garden Isle charm extends to its tight-knit business community. Whether you're running a Poipu restaurant or a Kapaa surf shop, processing fees take a real bite out of your revenue. TechSavvy brings zero-fee processing to Kaua'i so you keep every dollar you earn from locals and visitors alike.",
    testimonial: { quote: "Best part is no contracts. We tried it, loved it, and we've been saving ever since.", name: "Cafe Owner", biz: "Kapaa" },
    seo: {
      title: "Payment Processing Kaua'i | Zero Fees | TechSavvy Hawaii",
      description: "Kaua'i businesses save $500-$3,000+/month with TechSavvy's zero-fee payment processing. Free equipment, no contracts. Serving Lihue, Poipu, Kapaa, Princeville & all of Kaua'i.",
      keywords: "payment processing Kauai, merchant services Lihue, zero fee credit card Poipu, POS terminal Kapaa, Kauai business payment processing",
    },
  },
};

export default function IslandPage() {
  const params = useParams<{ island: string }>();
  const island = islands[params.island || ""];

  if (!island) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Island not found</h1>
            <a href="/" className="text-primary underline">Back to home</a>
          </div>
        </div>
      </Layout>
    );
  }

  useSEO({
    title: island.seo.title,
    description: island.seo.description,
    keywords: island.seo.keywords,
    canonical: `https://techsavvyhawaii.com/locations/${island.slug}`,
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-5 text-primary border-primary/30 bg-primary/5">
                <MapPin className="w-3 h-3 mr-1" />
                Serving {island.fullName}
              </Badge>
            </motion.div>
            <motion.h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6" variants={fadeUp}>
              Zero-Fee Payment Processing for{" "}
              <span className="text-primary">{island.name} Businesses</span>
            </motion.h1>
            <motion.p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto" variants={fadeUp}>
              {island.description}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" variants={fadeUp}>
              <Button size="lg" className="px-8" asChild>
                <a href="/statement-review">
                  Free AI Statement Analysis
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

      {/* Local businesses we serve */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
              {island.name} businesses we help
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {island.businesses.map((b) => (
                <div key={b} className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground/90">{b}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Plus convenience stores, gas stations, hotels, food trucks, medical offices, and any business that accepts credit cards on {island.name}.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 sm:py-20 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/50 via-transparent to-card/50" />
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">What every {island.name} merchant gets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "$0 processing fees — forever",
                "$0 monthly fees",
                "Free terminal for qualifying businesses",
                "No contracts — cancel anytime",
                "Next-day deposits",
                "Local Hawai'i support team",
                "Setup in 3-7 days",
                "Fully legal & compliant",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="border-primary/15">
            <CardContent className="p-6 sm:p-10">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg sm:text-xl text-foreground leading-relaxed mb-4 italic">
                "{island.testimonial.quote}"
              </p>
              <div className="font-semibold text-foreground">{island.testimonial.name}</div>
              <div className="text-sm text-muted-foreground">{island.testimonial.biz}, {island.name}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Card className="border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
            <CardContent className="p-8 sm:p-12 relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                Ready to stop losing money on {island.name}?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Mahalo for considering TechSavvy. Get your free AI statement analysis and see exactly how much you'll keep.
              </p>
              <Button size="lg" className="px-8" asChild>
                <a href="/statement-review">
                  Get Your Free Analysis
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
