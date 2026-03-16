import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APE — Automated Prompt Engineer",
  description:
    "Self-optimizing AI prompt system. Write, test, score, and rewrite prompts automatically until they hit your accuracy target.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50" style={{
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-decoration-none">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white' }}>
                A
              </div>
              <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                APE
              </span>
              <span className="badge badge-neutral text-xs">v1.0</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="btn-ghost text-sm">Dashboard</Link>
              <Link href="/history" className="btn-ghost text-sm">History</Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
