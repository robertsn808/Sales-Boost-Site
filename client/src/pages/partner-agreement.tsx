import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Handshake,
  CheckCircle,
  Shield,
  DollarSign,
  Zap,
  Users,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

export default function PartnerAgreementPage() {
  useSEO({
    title: "Partner Agreement | TechSavvy Hawaii",
    description:
      "Become a TechSavvy Hawaii partner. Zero-fee payment processing, free terminals, and ongoing support for your merchants.",
    keywords:
      "partner agreement, merchant services partner, ISO agent, payment processing partnership",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    partnerName: "",
    businessName: "",
    email: "",
    phone: "",
    address: "",
    businessType: "",
    agreeTerms: false,
    signature: "",
    date: new Date().toLocaleDateString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms || !form.signature || !form.partnerName || !form.email || !form.businessName) return;

    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/partner-agreement", form);
      setSubmitted(true);
      toast({ title: "Agreement submitted!", description: "We'll be in touch within 24 hours." });
    } catch {
      toast({
        title: "Submission failed",
        description: "Please try again or call us at (808) 767-5460.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  if (submitted) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg text-center"
          >
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-3">Agreement Submitted</h1>
            <p className="text-muted-foreground mb-6">
              Thank you, {form.partnerName}! Your partner agreement has been received.
              Our team will review it and reach out within 24 hours.
            </p>
            <Button asChild size="lg">
              <a href="/">Back to Home</a>
            </Button>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(74,234,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,234,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20">
              <Handshake className="w-3.5 h-3.5 mr-1.5" />
              Partner Program
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
              TechSavvy Partner
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join our network of merchant services partners. Earn recurring revenue, get free terminals for your
            merchants, and leverage our AI-powered sales tools.
          </motion.p>

          <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: DollarSign, text: "Recurring commissions" },
              { icon: Zap, text: "Free terminals & setup" },
              { icon: Users, text: "Dedicated support team" },
            ].map((item) => (
              <div key={item.text} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Agreement Form */}
      <section className="py-16 px-4">
        <motion.div
          className="max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <div className="h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary" />
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Partner Agreement</h2>
                  <p className="text-sm text-muted-foreground">Fill out the form below to get started</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={form.partnerName}
                      onChange={(e) => update("partnerName", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Business Name *</label>
                    <Input
                      value={form.businessName}
                      onChange={(e) => update("businessName", e.target.value)}
                      placeholder="Your business name"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@business.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="(808) 555-1234"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Business Address</label>
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Street, City, State, ZIP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Business Type</label>
                  <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso-agent">ISO / Agent</SelectItem>
                      <SelectItem value="referral">Referral Partner</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Terms */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Partnership Terms</p>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>Partner agrees to represent TechSavvy Hawaii products and services accurately.</li>
                      <li>Commissions are paid monthly on active merchant accounts referred by partner.</li>
                      <li>Free terminal equipment is provided for each approved merchant referral.</li>
                      <li>Either party may terminate the partnership with 30 days written notice.</li>
                      <li>Partner will not make unauthorized promises regarding pricing or services.</li>
                      <li>TechSavvy Hawaii provides ongoing training, marketing materials, and support.</li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree"
                    checked={form.agreeTerms}
                    onCheckedChange={(v) => update("agreeTerms", !!v)}
                  />
                  <label htmlFor="agree" className="text-sm cursor-pointer">
                    I have read and agree to the partnership terms outlined above. *
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Signature (Type your full name) *</label>
                    <Input
                      value={form.signature}
                      onChange={(e) => update("signature", e.target.value)}
                      placeholder="Your full legal name"
                      className="italic"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Date</label>
                    <Input value={form.date} disabled className="bg-muted/30" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !form.agreeTerms || !form.signature || !form.partnerName || !form.email || !form.businessName}
                  className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Handshake className="w-4 h-4 mr-2" />
                      Submit Partner Agreement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Questions? Call us at (808) 767-5460 or email contact@techsavvyhawaii.com
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
}
