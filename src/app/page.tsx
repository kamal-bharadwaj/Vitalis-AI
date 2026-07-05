import Link from "next/link";
import { Shield, Brain, FileText, MessageSquare, Lock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "MedicBot — AI Medical Assistant",
  description:
    "Upload your medical reports and get instant, secure AI-powered answers about your health.",
};

const features = [
  {
    icon: FileText,
    title: "Smart Report Parsing",
    description:
      "Upload PDFs or scanned images of your medical reports. MedicBot extracts and understands the content automatically.",
  },
  {
    icon: Brain,
    title: "RAG-Powered Answers",
    description:
      "Our AI retrieves the most relevant sections of your reports before generating precise, contextual answers.",
  },
  {
    icon: MessageSquare,
    title: "Conversational Interface",
    description:
      "Ask questions in plain language. Get clear, medically-informed responses sourced directly from your reports.",
  },
  {
    icon: Shield,
    title: "Privacy-First Design",
    description:
      "End-to-end security with Row Level Security. Your data is isolated — only you can see it.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Lock className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">MedicBot</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-border">
            <Shield className="size-3" />
            HIPAA-inspired security architecture
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-3xl mx-auto leading-tight">
            Your medical reports,{" "}
            <span className="text-primary/70">understood by AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your lab reports, prescriptions, or scan results. Ask
            questions in plain English. Get precise answers — powered by
            RAG and secured by Supabase RLS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              id="cta-get-started"
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg"
            >
              Get Started Free
              <ChevronRight className="size-4" />
            </Link>
            <Link
              href="/login"
              id="cta-sign-in"
              className="flex items-center gap-2 border border-border hover:bg-muted transition-colors px-8 py-3.5 rounded-xl font-semibold text-base text-foreground"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 border-t border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything you need
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to understand your health?
          </h2>
          <p className="text-muted-foreground mb-8">
            Register as a patient and upload your first report in minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg"
          >
            Create Free Account
            <ChevronRight className="size-4" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary flex items-center justify-center">
              <Lock className="size-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">MedicBot</span>
          </div>
          <p>© {new Date().getFullYear()} MedicBot. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
