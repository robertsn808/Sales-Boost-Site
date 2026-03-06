import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSearch,
  Mail,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Loader2,
  BookOpen,
  Eye,
  TrendingDown,
  Zap,
  XCircle,
  BarChart3,
  Send,
  FileText,
  X,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer, scaleIn } from "@/lib/animations";
import Layout from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

type AnalysisState = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface HiddenFee {
  name: string;
  amount: string;
  severity: "high" | "medium" | "low";
  explanation: string;
}

interface AnalysisResult {
  summary: string;
  effectiveRate: string;
  industryAverage: string;
  estimatedOverpay: string;
  monthlyVolume: string;
  hiddenFees: HiddenFee[];
  recommendations: string[];
  overallGrade: "A" | "B" | "C" | "D" | "F";
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 border-green-400/30 bg-green-400/10",
  B: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  C: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  D: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  F: "text-red-400 border-red-400/30 bg-red-400/10",
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-red-500/40 bg-red-500/10 text-red-400",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  low: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  high: <XCircle className="w-4 h-4 text-red-400" />,
  medium: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  low: <Eye className="w-4 h-4 text-cyan-400" />,
};

export default function StatementReviewPage() {
  useSEO({
    title: "Free AI Statement Review | TechSavvy Hawaii",
    description:
      "Upload your merchant statement and our AI instantly identifies hidden fees, inflated rates, and overcharges. Get a free savings report in minutes.",
    keywords:
      "merchant statement review, hidden fees, credit card processing, payment processing analysis, free statement audit",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // Email form states
  const [emailMode, setEmailMode] = useState<"report" | "booklets" | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const validateAndSetFile = (f: File) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowed.includes(f.type) && !f.name.toLowerCase().endsWith(".heic")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image (JPG, PNG, WEBP, HEIC).",
        variant: "destructive",
      });
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20 MB.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setResult(null);
    setAnalysisState("idle");
    setError("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const analyzeStatement = async () => {
    if (!file) return;
    setAnalysisState("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("statement", file);

      setAnalysisState("analyzing");

      const response = await fetch("/api/statement-review/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed. Please try again.");
      }

      const data = await response.json();
      setResult(data);
      setAnalysisState("complete");
      // Auto-open email capture — send report to visitor's inbox
      setEmailMode("report");
      setEmailSent(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setAnalysisState("error");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setEmailSending(true);
    try {
      await apiRequest("POST", "/api/statement-review/email", {
        email,
        name,
        business,
        type: emailMode,
        analysis: emailMode === "report" ? result : null,
      });
      setEmailSent(true);
      toast({
        title: emailMode === "report" ? "Report sent!" : "Guides on the way!",
        description: `Check ${email} — you'll have it in a few minutes.`,
      });
    } catch {
      toast({
        title: "Send failed",
        description: "Please try again or call us at (808) 767-5460.",
        variant: "destructive",
      });
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Layout>
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(74,234,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,234,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 text-center py-24"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              AI-Powered • Free • No Obligation
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
          >
            Your processor is{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
                overcharging you
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-red-500/15 -skew-x-3 rounded" />
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
              Let's prove it.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload your merchant statement and our AI scans every line —
            interchange markups, hidden fees, junk charges, PCI non-compliance penalties —
            and shows you exactly what you're overpaying.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: ShieldCheck, text: "256-bit encrypted" },
              { icon: Eye, text: "We never store your data" },
              { icon: Zap, text: "Results in under 60 seconds" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── TWO PATHS ────────────────────────────────────── */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Choose how you'd like to review your statement</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get instant AI analysis, or request our free guides and do it yourself.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Path 1: AI Upload */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur h-full group hover:border-primary/40 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileSearch className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1 border-primary/30 text-primary">RECOMMENDED</Badge>
                      <h3 className="text-xl font-bold">AI Statement Analysis</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Upload your statement and get a full breakdown of hidden fees,
                    your effective rate vs. industry average, and estimated annual savings — instantly.
                  </p>

                  {/* Upload zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragOver
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : file
                        ? "border-green-500/40 bg-green-500/5"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {file ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
                        <p className="font-medium text-green-400">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB •{" "}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setResult(null);
                              setAnalysisState("idle");
                            }}
                            className="text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium">Drop your statement here</p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse • PDF, JPG, PNG up to 20 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={analyzeStatement}
                    disabled={!file || analysisState === "analyzing" || analysisState === "uploading"}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                    size="lg"
                  >
                    {analysisState === "uploading" || analysisState === "analyzing" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {analysisState === "uploading" ? "Uploading..." : "Analyzing statement..."}
                      </>
                    ) : analysisState === "complete" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Re-analyze
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze My Statement
                      </>
                    )}
                  </Button>

                  {error && (
                    <p className="text-sm text-red-400 mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Path 2: Self-Review Booklets */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur h-full hover:border-primary/30 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1 border-cyan-400/30 text-cyan-400">DIY OPTION</Badge>
                      <h3 className="text-xl font-bold">Self-Review Guides</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Prefer to do it yourself? We'll email you our free guides so you can
                    audit your own statement at your own pace.
                  </p>

                  <div className="rounded-xl overflow-hidden mb-6">
                    <img
                      src="/images/statement-analysis-guides.png"
                      alt="Free payment processing guides — Rate Comparison Guide, Statement Checklist, Security Checklist, and Cash Discount Explained"
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { title: "Statement Checklist", desc: "10-point audit to catch hidden fees" },
                      { title: "Rate Comparison Guide", desc: "Industry benchmarks for 8+ verticals" },
                      { title: "Security Checklist", desc: "PCI compliance & fraud prevention" },
                      { title: "Cash Discount Guide", desc: "Eliminate processing fees entirely" },
                    ].map((guide) => (
                      <div
                        key={guide.title}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <FileText className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{guide.title}</p>
                          <p className="text-xs text-muted-foreground">{guide.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      setEmailMode("booklets");
                      setEmailSent(false);
                    }}
                    variant="outline"
                    className="w-full h-12 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Me the Guides
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── ANALYSIS RESULTS ─────────────────────────────── */}
      <AnimatePresence>
        {result && analysisState === "complete" && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="py-16 px-4"
            id="results"
          >
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Analysis Complete
                </Badge>
                <h2 className="text-3xl font-bold mb-2">Your Statement Report</h2>
                <p className="text-muted-foreground">{result.summary}</p>
              </div>

              {/* Score Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <Card className="bg-card/60 backdrop-blur border-border/50">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Statement Grade</p>
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl font-black border-2 ${GRADE_COLORS[result.overallGrade] || GRADE_COLORS.C}`}>
                      {result.overallGrade}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur border-border/50">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Effective Rate</p>
                    <p className="text-3xl font-bold text-red-400">{result.effectiveRate}</p>
                    <p className="text-xs text-muted-foreground mt-1">Industry avg: {result.industryAverage}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur border-border/50">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Monthly Overpay</p>
                    <p className="text-3xl font-bold text-orange-400">{result.estimatedOverpay}</p>
                    <p className="text-xs text-muted-foreground mt-1">Vol: {result.monthlyVolume}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur border-border/50">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hidden Fees Found</p>
                    <p className="text-3xl font-bold text-yellow-400">{result.hiddenFees.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">flagged line items</p>
                  </CardContent>
                </Card>
              </div>

              {/* Hidden Fees List */}
              {result.hiddenFees.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Hidden & Excessive Fees Detected
                  </h3>
                  <div className="space-y-3">
                    {result.hiddenFees.map((fee, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-start gap-4 p-4 rounded-xl border ${SEVERITY_STYLES[fee.severity]}`}
                      >
                        <div className="mt-0.5">{SEVERITY_ICON[fee.severity]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm">{fee.name}</p>
                            <Badge variant="outline" className={`shrink-0 text-xs ${SEVERITY_STYLES[fee.severity]}`}>
                              {fee.amount}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{fee.explanation}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-400" />
                    Recommendations to Lower Your Costs
                  </h3>
                  <Card className="bg-card/60 backdrop-blur border-green-500/20">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => {
                    setEmailMode("report");
                    setEmailSent(false);
                  }}
                  className="bg-primary hover:bg-primary/90 font-semibold h-12 px-8"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Me This Report
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/30 font-semibold h-12 px-8"
                  size="lg"
                  asChild
                >
                  <a href="/contact">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Get a Custom Savings Quote
                  </a>
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── ANALYZING ANIMATION ──────────────────────────── */}
      <AnimatePresence>
        {(analysisState === "uploading" || analysisState === "analyzing") && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 px-4"
          >
            <div className="max-w-md mx-auto text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-cyan-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                <FileSearch className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {analysisState === "uploading" ? "Uploading your statement..." : "Scanning for hidden fees..."}
              </h3>
              <p className="text-sm text-muted-foreground">
                {analysisState === "analyzing"
                  ? "Our AI is reviewing every line item, comparing rates to industry benchmarks, and calculating your potential savings."
                  : "Securely transferring your file for analysis."}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From upload to savings — here's what happens behind the scenes.
            </p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload",
                desc: "Drop your monthly merchant statement — PDF or photo. We accept all processors.",
              },
              {
                step: "02",
                icon: FileSearch,
                title: "AI Scans",
                desc: "Our AI reads every fee, rate, and charge. It flags hidden costs most people miss.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Compare",
                desc: "Your rates are compared to industry benchmarks for your business type and volume.",
              },
              {
                step: "04",
                icon: DollarSign,
                title: "Save",
                desc: "Get your savings report with specific recommendations to lower your costs immediately.",
              },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <Card className="bg-card/40 backdrop-blur border-border/50 h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <span className="text-4xl font-black text-primary/15">{item.step}</span>
                    <item.icon className="w-8 h-8 text-primary mb-3 -mt-4" />
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST STRIP ──────────────────────────────────── */}
      <section className="py-12 px-4 border-y border-border/30">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            {
              stat: "73%",
              label: "of merchants are overpaying",
              sub: "without knowing it",
            },
            {
              stat: "$340",
              label: "average monthly savings",
              sub: "after switching processors",
            },
            {
              stat: "60 sec",
              label: "to get your report",
              sub: "no commitment required",
            },
          ].map((item) => (
            <div key={item.stat}>
              <p className="text-3xl font-black text-primary">{item.stat}</p>
              <p className="font-medium text-sm mt-1">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────── */}
      <section className="py-20 px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-4">
            Still not sure?{" "}
            <span className="text-primary">Talk to a human.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our payment consultants review statements all day. Call or email us and we'll walk through yours together — no pressure, no commitment.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 font-semibold" asChild>
              <a href="tel:+18087675460">
                📞 (808) 767-5460
              </a>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 font-semibold" asChild>
              <a href="mailto:contact@techsavvyhawaii.com">
                <Mail className="w-4 h-4 mr-2" />
                contact@techsavvyhawaii.com
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ─── EMAIL MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {emailMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEmailMode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setEmailMode(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              {emailSent ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {emailMode === "report" ? "Report Sent!" : "Guides on the Way!"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Check <strong>{email}</strong> — you should receive it within a few minutes.
                    Be sure to check your spam folder.
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => setEmailMode(null)}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    {emailMode === "report" ? (
                      <BarChart3 className="w-8 h-8 text-primary" />
                    ) : (
                      <BookOpen className="w-8 h-8 text-cyan-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold">
                        {emailMode === "report"
                          ? "Where should we send your report?"
                          : "Get Free Statement Review Guides"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {emailMode === "report"
                          ? "Enter your info and we'll email a formatted copy with your full savings breakdown."
                          : "4 guides to help you audit your own statement."}
                      </p>
                    </div>
                  </div>

                  {/* Grade teaser for report mode */}
                  {emailMode === "report" && result && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 mb-6">
                      <div className={`flex items-center justify-center w-14 h-14 rounded-xl text-2xl font-black border-2 ${
                        result.overallGrade === "A" || result.overallGrade === "B" ? "border-green-500/40 text-green-400 bg-green-500/10"
                        : result.overallGrade === "C" ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                        : "border-red-500/40 text-red-400 bg-red-500/10"
                      }`}>
                        {result.overallGrade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Your statement scored a {result.overallGrade}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.hiddenFees.length} hidden fee{result.hiddenFees.length !== 1 ? "s" : ""} found
                          {result.estimatedOverpay && result.estimatedOverpay !== "N/A" ? ` · Est. ${result.estimatedOverpay}/mo overpay` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name *</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email *</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@business.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Business Name</label>
                      <Input
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={emailSending || !email || !name}
                      className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
                    >
                      {emailSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {emailMode === "report" ? "Get My Full Report" : "Send Me the Guides"}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      No spam. We'll only use your email to send the requested materials.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
