import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Shield,
  Sparkles,
  Library,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicBackground, HERO_IMAGE } from "@/components/layout/PublicBackground";

const features = [
  {
    icon: Library,
    title: "Rich Catalog",
    description: "Browse titles across every genre, beautifully organized and always up to date.",
  },
  {
    icon: BookOpen,
    title: "Seamless Borrowing",
    description: "Issue and return books in seconds with smart due-date tracking.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Timely reminders and overdue notifications so you never miss a return.",
  },
  {
    icon: Sparkles,
    title: "AI Librarian",
    description: "Personalized book recommendations powered by Pustaka AI.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <PublicBackground />
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground shadow-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                Modern Library Management
              </div>

              <div className="space-y-4">
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Pustaka
                </h1>
                <p className="text-xl sm:text-2xl font-serif text-primary font-medium">
                  Where Knowledge Lives &amp; Stories Come Alive
                </p>
                <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
                  Discover, borrow, and grow — a refined digital library experience
                  built for students and administrators.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login/user" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full sm:min-w-[200px] h-12 gap-2 group">
                    <GraduationCap className="w-5 h-5" />
                    Login as Student
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/login/admin" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full sm:min-w-[200px] h-12 gap-2 group border-primary/30 hover:bg-primary/5">
                    <Shield className="w-5 h-5" />
                    Login as Admin
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-2xl" />
              <Card className="relative overflow-hidden border-border shadow-2xl">
                <div className="aspect-[4/3] relative">
                  <img
                    src={HERO_IMAGE}
                    alt="Library shelves filled with books"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-serif font-semibold text-lg">Your Digital Library</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      Thousands of titles at your fingertips
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete library ecosystem for learning institutions
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-sidebar text-sidebar-foreground border-sidebar-border overflow-hidden">
              <CardContent className="p-10 sm:p-14 text-center relative">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
                <div className="relative space-y-6">
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                    Ready to Begin Your Journey?
                  </h2>
                  <p className="text-sidebar-foreground/70 max-w-md mx-auto">
                    Join Pustaka and experience thoughtful library management designed for readers and librarians alike.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="min-w-[180px] gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Student Sign Up
                      </Button>
                    </Link>
                    <Link href="/register/admin">
                      <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[180px] gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Sign Up
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sidebar-foreground/60 text-sm">
                    Already have an account?{" "}
                    <Link href="/login/user" className="underline hover:text-sidebar-foreground">
                      Student login
                    </Link>
                    {" · "}
                    <Link href="/login/admin" className="underline hover:text-sidebar-foreground">
                      Admin login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-serif font-semibold text-foreground">Pustaka</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Where Knowledge Lives &amp; Stories Come Alive
        </p>
      </footer>
    </div>
  );
}
