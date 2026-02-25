"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, BarChart3, Receipt, Calendar, Box, Tags, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingDemo() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/30 font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    {/* Logo */}
                    <img src="/Logo.png" alt="SmartBench" className="h-8 w-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight">SmartBench</span>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium">
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center min-h-[90vh] justify-center">
                {/* Background Grid Image Effect */}
                <div className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none overflow-hidden flex justify-center items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="grid grid-cols-3 gap-4 w-[120vw] h-[120vh] transform -rotate-12 scale-110 blur-[2px]"
                    >
                        <img src="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=800&q=80" className="w-full h-full object-cover rounded-2xl" alt="" />
                        <img src="https://images.unsplash.com/photo-1504307651254-35680f356f27?w=800&q=80" className="w-full h-full object-cover rounded-2xl" alt="" />
                        <img src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80" className="w-full h-full object-cover rounded-2xl" alt="" />
                        <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80" className="w-full h-full object-cover rounded-2xl hidden md:block" alt="" />
                        <img src="https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=800&q=80" className="w-full h-full object-cover rounded-2xl hidden md:block" alt="" />
                        <img src="https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?w=800&q=80" className="w-full h-full object-cover rounded-2xl hidden md:block" alt="" />
                    </motion.div>
                    {/* Radial gradient to fade edges to black */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1]"
                    >
                        The Workforce Engine <br />
                        <span className="text-zinc-500">for Construction</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light"
                    >
                        Sourcing, deployment, and payroll all in one platform connected to a marketplace of verified tradespeople... ending the feast or famine cycle.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex justify-center pt-8"
                    >
                        <button className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-zinc-200 transition-colors flex items-center gap-3">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 animate-bounce text-zinc-600">
                    <ChevronDown className="w-6 h-6" />
                </div>
            </section>

            {/* Marquee Section */}
            <section className="py-10 border-y border-white/5 bg-black/50 overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
                <div className="flex gap-24 items-center whitespace-nowrap opacity-70 px-10 animate-[scroll_40s_linear_infinite]">
                    {/* Duplicated for smooth scrolling */}
                    {[
                        "SmartBench cut our payroll prep time by 50%",
                        "Finally found reliable framers when we needed them most",
                        "The automated compliance checks save us so many headaches",
                        "We scaled our crew by 30% without adding back-office staff",
                        "A game changer for managing our subcontractors' timesheets",
                        "SmartBench cut our payroll prep time by 50%",
                        "Finally found reliable framers when we needed them most",
                        "The automated compliance checks save us so many headaches",
                        "We scaled our crew by 30% without adding back-office staff",
                        "A game changer for managing our subcontractors' timesheets"
                    ].map((quote, i) => (
                        <div key={i} className="text-xl italic font-serif tracking-wide flex items-center gap-8 text-zinc-300">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 block" /> "{quote}"
                        </div>
                    ))}
                </div>
            </section>

            {/* Problem / Solution Section */}
            <section className="py-32 px-6 max-w-6xl mx-auto relative">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Scale your business, <br /><span className="text-zinc-600 italic font-serif">not your overhead</span></h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Problem */}
                    <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-3xl relative overflow-hidden backdrop-blur-sm">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">The Problem</div>
                        <p className="text-xl leading-relaxed text-zinc-300">
                            Most subcontractors waste time and money hunting for labor, managing fragmented timesheets, and dealing with compliance risks because their tools are disconnected.
                        </p>
                    </div>

                    {/* Solution */}
                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 p-10 rounded-3xl relative overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <CheckCircle2 className="w-32 h-32" />
                        </div>
                        <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-6">The Solution</div>
                        <p className="text-xl leading-relaxed text-white relative z-10">
                            One unified platform that handles compliance, automatic timesheets, and connects you instantly with verified local talent. Less paperwork, more building.
                        </p>
                    </div>
                </div>
            </section>

            {/* All-In-One Section */}
            <section className="py-32 px-6 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">All-in-one Engine</h2>
                    <p className="text-xl text-zinc-400 mb-20 max-w-2xl mx-auto">
                        Rosters, timesheets, compliance, payments, and talent discovery... everything in one place.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
                        {/* Feature Nodes */}
                        {[
                            { icon: BarChart3, label: "Interactive Dashboard" },
                            { icon: Receipt, label: "Automated Payroll" },
                            { icon: Calendar, label: "Digital Timesheets" },
                            { icon: Box, label: "Compliance Vault" },
                            { icon: Tags, label: "Skill Matching" },
                            { icon: MoreHorizontal, label: "And much more..." },
                        ].map((feat, idx) => (
                            <div key={idx} className="bg-black border border-white/5 hover:border-white/20 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center gap-4 group cursor-default">
                                <feat.icon className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" strokeWidth={1.5} />
                                <span className="text-sm font-medium text-zinc-400 group-hover:text-white">{feat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer / CTA */}
            <section className="py-32 px-6 bg-black relative border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center space-y-10">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Ready to build?</h2>
                    <p className="text-xl text-zinc-500">Join the top-tier subcontractors already using SmartBench.</p>
                    <button className="bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:bg-zinc-200 transition-colors inline-block mt-8">
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* Global CSS for marquee animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
        </div>
    );
}
