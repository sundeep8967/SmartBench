"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Star, MapPin, Calendar, Shield, Award, Briefcase, ChevronLeft } from "lucide-react";
import { useState } from "react";

// Mock Data (matches marketplace data for consistency)
const WORKERS = [
    { id: 1, name: "Mike Ross", role: "Master Electrician", rating: 4.9, rate: 55, skills: ["Industrial", "High Voltage", "Wiring"], avatar: "MR", location: "Minneapolis, MN", bio: "Experienced Master Electrician with over 15 years in industrial and commercial projects. OSHA 30 certified and specialize in high voltage systems." },
    { id: 2, name: "Rachel Zane", role: "Project Manager", rating: 4.8, rate: 75, skills: ["Planning", "Budgeting", "Safety"], avatar: "RZ", location: "St. Paul, MN", bio: "Detail-oriented Project Manager with a track record of delivering projects on time and under budget. Expert in safety compliance and team leadership." },
    { id: 3, name: "Harvey Specter", role: "Site Foreman", rating: 5.0, rate: 95, skills: ["Leadership", "Commercial", "Zoning"], avatar: "HS", location: "Edina, MN", bio: "Seasoned Site Foreman who closes deals and manages commercial sites with precision. Known for solving complex zoning issues." },
    { id: 4, name: "Donna Paulsen", role: "Interior Specialist", rating: 4.9, rate: 65, skills: ["Finishing", "Design", "Detailing"], avatar: "DP", location: "Bloomington, MN", bio: "Interior Specialist who knows what you need before you do. Exceptional at finishing work and design detailing." },
    { id: 5, name: "Louis Litt", role: "HVAC Technician", rating: 4.7, rate: 60, skills: ["Ventilation", "Heating", "Repairs"], avatar: "LL", location: "Minnetonka, MN", bio: "HVAC Technician passionate about ventilation systems. Thorough in diagnostics and repairs." },
    { id: 6, name: "Jessica P.", role: "Senior Architect", rating: 5.0, rate: 120, skills: ["Blueprints", "Modeling", "Surveying"], avatar: "JP", location: "Chicago, IL", bio: "Senior Architect with a vision for modern structures. Expert in blueprints, modeling, and site surveying." },
];

export default function WorkerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    // Ensure params.id is a string before parsing
    const workerId = typeof params.id === "string" ? parseInt(params.id) : 1;
    const worker = WORKERS.find(w => w.id === workerId) || WORKERS[0];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ChevronLeft size={16} className="mr-1" />
                Back to Marketplace
            </button>

            {/* Header Card */}
            <Card className="p-6 md:p-8 border-gray-200 shadow-sm relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <Shield size={12} className="mr-1" /> Verified & Insured
                    </span>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="h-32 w-32 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-4xl border-4 border-white shadow-lg shrink-0">
                        {worker.avatar}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">{worker.name}</h1>
                            <BadgeCheck size={24} className="text-blue-500" />
                        </div>
                        <p className="text-xl text-gray-600 font-medium">{worker.role}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 mt-2">
                            <div className="flex items-center">
                                <MapPin size={16} className="mr-1 text-gray-400" />
                                {worker.location}
                            </div>
                            <div className="flex items-center">
                                <Star size={16} className="mr-1 text-yellow-400 fill-current" />
                                <span className="font-bold text-gray-900 mr-1">{worker.rating}</span>
                                (24 reviews)
                            </div>
                            <div className="flex items-center">
                                <Briefcase size={16} className="mr-1 text-gray-400" />
                                5 Years Exp.
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                            {worker.skills.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                        <div>
                            <span className="text-3xl font-bold text-gray-900">${worker.rate}</span>
                            <span className="text-gray-500">/hr</span>
                        </div>
                        <Button
                            className="bg-blue-900 hover:bg-blue-800 text-white w-full"
                            onClick={() => router.push('/dashboard/checkout?workerId=' + worker.id)}
                        >
                            Book Profile
                        </Button>
                        <Button variant="outline" className="w-full">
                            Message
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-2">Available for next day start</p>
                    </div>
                </div>
            </Card>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-4">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("work_history")}
                            className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'work_history' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Work History
                        </button>
                        <button
                            onClick={() => setActiveTab("certifications")}
                            className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'certifications' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Certifications
                        </button>
                    </div>

                    <Card className="p-6 rounded-t-none border-t-0 shadow-sm border-gray-200">
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900">About {worker.name}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {worker.bio}
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    Highly reliable and dedicated professional. consistently receives positive feedback from site supervisors regarding punctuality, safety adherence, and technical skill. Capable of working independently or leading small crews.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                                        <p className="text-sm text-gray-600">Mon - Fri, 7:00 AM - 4:00 PM</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 mb-2">Tools</h4>
                                        <p className="text-sm text-gray-600">Fully Equipped (Standard Trade Tools)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'work_history' && (
                            <div className="space-y-6">
                                <div className="border-l-2 border-gray-200 pl-4 pb-6 relative">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-900 border-4 border-white"></div>
                                    <h4 className="font-bold text-gray-900">Downtown Office Complex</h4>
                                    <p className="text-sm text-gray-500 mb-2">Oct 2025 - Dec 2025 • 2 Months</p>
                                    <p className="text-gray-600 text-sm">Responsible for wiring 3 floors of a new commercial building. Managed a team of 2 apprentices.</p>
                                </div>
                                <div className="border-l-2 border-gray-200 pl-4 pb-0 relative">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300 border-4 border-white"></div>
                                    <h4 className="font-bold text-gray-900">Riverside Apartments Renovation</h4>
                                    <p className="text-sm text-gray-500 mb-2">Jun 2025 - Sep 2025 • 4 Months</p>
                                    <p className="text-gray-600 text-sm">Full electrical system upgrade for a 20-unit apartment complex. Passed all inspections on first review.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'certifications' && (
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Award className="text-blue-900" size={24} />
                                        <div>
                                            <h4 className="font-bold text-gray-900">OSHA 30 Construction</h4>
                                            <p className="text-xs text-gray-500">Issued Jan 2024</p>
                                        </div>
                                    </div>
                                    <BadgeCheck className="text-green-500" size={20} />
                                </div>
                                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Award className="text-blue-900" size={24} />
                                        <div>
                                            <h4 className="font-bold text-gray-900">Licensed Master Electrician</h4>
                                            <p className="text-xs text-gray-500">State License #MN-12345</p>
                                        </div>
                                    </div>
                                    <BadgeCheck className="text-green-500" size={20} />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="p-5 shadow-sm border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">Performance Stats</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Punctuality</span>
                                    <span className="font-bold text-gray-900">5.0</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-900 w-full rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Quality of Work</span>
                                    <span className="font-bold text-gray-900">4.9</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-900 w-[98%] rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Safety Adherence</span>
                                    <span className="font-bold text-gray-900">5.0</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-900 w-full rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 shadow-sm border-gray-200 bg-blue-50">
                        <h3 className="font-bold text-blue-900 mb-2">Lender Info</h3>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-900 font-bold border border-blue-100">
                                SC
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Summit Construction</h4>
                                <p className="text-xs text-gray-500">Verified Partner</p>
                            </div>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            Summit Construction has been a lender on SmartBench for 2 years with a 100% satisfaction rate.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
