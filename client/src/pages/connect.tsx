import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Calendar,
  Globe,
  Palette,
  ShoppingCart,
  Bot,
  User,
  Send,
  Loader2,
  MapPin,
  CheckCircle,
  Sparkles,
  Monitor,
  Code,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import type { AiConfig } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ConnectHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-36 sm:pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex flex-wrap items-center justify-center gap-2" variants={fadeUp}>
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">
              <MessageSquare className="w-3 h-3 mr-1" />
              Connect With Us
            </Badge>
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">
              <MapPin className="w-3 h-3 mr-1" />
              Honolulu, HI
            </Badge>
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-6"
            variants={fadeUp}
          >
            Let's Talk About{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              Your Business
            </span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto"
            variants={fadeUp}
          >
            Chat with our AI assistant, schedule a call, or explore how we can build your online presence. We're here to help your Hawai'i business grow.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
            variants={fadeUp}
          >
            <a
              href="tel:+18087675460"
              className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50 hover:border-primary/30 transition-colors"
              data-testid="link-connect-phone"
            >
              <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Call Us</div>
                <div className="text-sm font-semibold text-foreground">(808) 767-5460</div>
              </div>
            </a>
            <a
              href="mailto:contact@techsavvyhawaii.com"
              className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50 hover:border-primary/30 transition-colors"
              data-testid="link-connect-email"
            >
              <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Email Us</div>
                <div className="text-sm font-semibold text-foreground">contact@techsavvyhawaii.com</div>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-card/50" data-testid="text-connect-hours">
              <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Hours</div>
                <div className="text-sm font-semibold text-foreground">Mon-Fri, 8AM-5PM</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function AIChatSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: config } = useQuery<AiConfig>({
    queryKey: ["/api/ai-config"],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/chat", {
        message: trimmed,
        history: messages,
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again or call us at (808) 767-5460." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "How does zero-fee processing work?",
    "Tell me about the Cash Back program",
    "What are the pricing options?",
    "Do you work with high-risk merchants?",
  ];

  const welcomeMessage = config?.welcomeMessage ||
    "Hi! I'm TechSavvy's AI assistant. Ask me about our zero-fee payment processing, Cash Back, or high-risk merchant services.";

  return (
    <section className="py-12 sm:py-20 relative" data-testid="section-ai-chat">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
            <Bot className="w-3 h-3 mr-1.5" />
            AI Assistant
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Chat with TechSavvy AI
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Get instant answers about our services, pricing, and how we can help your business. Available 24/7.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden border-primary/15">
            <div className="bg-gradient-to-r from-primary/15 to-primary/5 border-b border-border/50 p-4 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">TechSavvy AI Assistant</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  {config?.enabled ? "Online" : "Available"}
                </div>
              </div>
            </div>

            <div className="h-[400px] overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-md rounded-tl-none p-3 text-sm text-foreground/90 max-w-[85%]">
                  {welcomeMessage}
                </div>
              </div>

              {messages.length === 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-xs text-muted-foreground text-center mb-3">Quick questions:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover-elevate transition-colors"
                        data-testid={`button-quick-q-${q.slice(0, 10)}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === "user" ? "bg-secondary" : "bg-primary/15"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={`rounded-md p-3 text-sm max-w-[85%] whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground/90 rounded-tl-none"
                    }`}
                    data-testid={`text-connect-chat-${i}`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-md rounded-tl-none p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/50 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config?.enabled ? "Ask me anything about TechSavvy..." : "AI chat is currently offline. Try calling us!"}
                  className="flex-1 bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
                  disabled={isLoading || !config?.enabled}
                  data-testid="input-connect-chat"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !config?.enabled}
                  data-testid="button-connect-chat-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!config?.enabled && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  AI chat is currently offline. Please call us at (808) 767-5460 or email contact@techsavvyhawaii.com
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function ScheduleCallSection() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    preferredDate: "",
    preferredTime: "",
    topic: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/contact-leads", {
        businessName: formData.topic || "Schedule a Call",
        contactName: formData.name,
        phone: formData.phone,
        email: formData.email,
        plan: "consultation",
        highRisk: false,
        monthlyProcessing: "unknown",
        bestContactTime: formData.preferredTime || "anytime",
      });
    } catch {
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <section className="py-12 sm:py-20 relative" data-testid="section-schedule-call">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              <Calendar className="w-3 h-3 mr-1.5" />
              Schedule a Call
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Book a Free Consultation
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
              Schedule a one-on-one call with our team. We'll walk you through our zero-fee processing, answer your questions, and put together a personalized plan for your business.
            </p>

            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: "Free savings analysis on your current processing fees" },
                { icon: CheckCircle, text: "Personalized website mockup for your business" },
                { icon: CheckCircle, text: "No commitment — just a friendly conversation" },
                { icon: CheckCircle, text: "Same-day follow-up with your custom quote" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <item.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-visible border-primary/10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
              <CardContent className="p-5 sm:p-6 relative">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-schedule-success">Call Scheduled!</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll reach out at your preferred time. Mahalo!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-schedule-call">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="John Doe"
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        data-testid="input-schedule-name"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Phone</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          placeholder="(808) 555-1234"
                          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          data-testid="input-schedule-phone"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="you@business.com"
                          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          data-testid="input-schedule-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Best Time to Call</label>
                      <select
                        required
                        value={formData.preferredTime}
                        onChange={(e) => set("preferredTime", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        data-testid="select-schedule-time"
                      >
                        <option value="">Select a time...</option>
                        <option value="morning">Morning (8am - 12pm)</option>
                        <option value="afternoon">Afternoon (12pm - 4pm)</option>
                        <option value="evening">Evening (4pm - 6pm)</option>
                        <option value="anytime">Anytime</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">What Would You Like to Discuss?</label>
                      <select
                        value={formData.topic}
                        onChange={(e) => set("topic", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        data-testid="select-schedule-topic"
                      >
                        <option value="">Select a topic...</option>
                        <option value="Zero-Fee Processing">Zero-Fee Payment Processing</option>
                        <option value="Cash Back">Cash Back Information</option>
                        <option value="Online Presence">Building My Online Presence</option>
                        <option value="High-Risk Account">High-Risk Merchant Account</option>
                        <option value="Premium Website">Premium Website Package</option>
                        <option value="Custom Software">Custom Software Solutions</option>
                        <option value="General Questions">General Questions</option>
                      </select>
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="button-schedule-submit">
                      {submitting ? "Scheduling..." : "Schedule My Free Call"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function ConnectPage() {
  useSEO({
    title: "Connect With TechSavvy Hawaii | AI Chat, Schedule Call, Get Started",
    description: "Connect with TechSavvy Hawaii's AI assistant, schedule a call, or start your free consultation. Zero-fee payment processing and Cash Back solutions for Hawaiian businesses.",
    keywords: "connect TechSavvy Hawaii, AI chat business Hawaii, schedule consultation Honolulu, payment processing demo, AI assistant merchant services",
    canonical: "https://techsavvyhawaii.com/connect",
    ogImage: "https://techsavvyhawaii.com/images/hero-hawaii-sunset.jpg",
  });

  return (
    <Layout>
      <ConnectHero />
      <AIChatSection />
      <ScheduleCallSection />
    </Layout>
  );
}
