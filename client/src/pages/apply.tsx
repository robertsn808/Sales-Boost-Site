import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Gift,
  Check,
  ShieldCheck,
  Clock,
  Phone,
  ArrowRight,
  Sparkles,
  Heart,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";

export default function ApplyPage() {
  useSEO({
    title: "Apply for Zero-Fee Credit Card Processing | Free Equipment | TechSavvy Hawaii",
    description:
      "Apply for zero-fee credit card processing in under 5 minutes. Cash discount program eliminates payment processing fees. Free POS terminal, no contracts. Hawaii businesses save $6,000–$36,000/year.",
    keywords:
      "apply credit card processing Hawaii, zero fee payment processing application, cash discount program signup, merchant services application Hawaii, card processing Hawaii apply, free POS terminal application, free credit card machine Hawaii",
    canonical: "https://techsavvyhawaii.com/apply",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Apply for Zero-Fee Credit Card Processing — TechSavvy Hawaii",
      url: "https://techsavvyhawaii.com/apply",
      description:
        "Apply for zero-fee credit card processing and payment processing in Hawaii. Cash discount program, free terminal, no contracts.",
      isPartOf: { "@id": "https://techsavvyhawaii.com/#website" },
    },
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-resize JotForm iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.startsWith("setHeight:")) {
        const height = parseInt(e.data.replace("setHeight:", ""), 10);
        if (iframeRef.current && height > 0) {
          iframeRef.current.style.height = `${height}px`;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
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
                Your gift is waiting
              </Badge>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4"
              variants={fadeUp}
            >
              We Want to{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Give You
              </span>{" "}
              Zero Processing Fees
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              Fill out the merchant agreement below and we'll set you up with a
              compliant cash discount program, a free terminal, and zero
              processing fees — our gift to your business.
            </motion.p>

            {/* Gift perks */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8"
              variants={fadeUp}
            >
              {[
                { icon: Gift, text: "Free POS terminal" },
                { icon: Heart, text: "Zero processing fees" },
                { icon: Sparkles, text: "No monthly charges" },
                { icon: ShieldCheck, text: "100% compliant" },
              ].map((perk) => (
                <div
                  key={perk.text}
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <perk.icon className="w-4 h-4 text-primary" />
                  <span>{perk.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* JotForm Embed */}
      <section className="pb-12 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-primary/10 bg-card shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Merchant Agreement
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complete to receive your free equipment & zero-fee setup
                  </p>
                </div>
              </div>
            </div>

            <iframe
              ref={iframeRef}
              id="JotFormIFrame-230935175729161"
              title="Merchant Agreement Application"
              src="https://paybotx.jotform.com/230935175729161"
              style={{
                minWidth: "100%",
                maxWidth: "100%",
                height: "1200px",
                border: "none",
              }}
              scrolling="no"
              allow="geolocation; microphone; camera; fullscreen"
            />
          </motion.div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>SSL encrypted & secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Approved within 24–48 hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-primary" />
              <span>Questions? Call (808) 767-5460</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Apply CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 p-8 sm:p-12 text-center">
            <Gift className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Here's What You're Getting — Free
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-6 text-left">
              {[
                "Free POS terminal or card reader",
                "0% credit card processing fees",
                "No monthly or hidden charges",
                "Free setup & installation",
                "Free merchant website",
                "Local Hawai'i support team",
                "Compliant cash discount program",
                "Next-day deposits available",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button size="lg" asChild>
              <a href="#JotFormIFrame-230935175729161">
                Claim Your Free Setup
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
