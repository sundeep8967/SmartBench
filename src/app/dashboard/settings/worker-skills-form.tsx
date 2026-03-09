"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Camera, User } from "lucide-react";

const TRADES = [
    "Carpentry", "Electrical", "Plumbing", "HVAC", "Masonry", "Painting",
    "Roofing", "Drywall", "Flooring", "Welding", "Concrete", "Landscaping",
    "General Labor", "Equipment Operation", "Insulation", "Glazing", "Other"
];

const SKILLS_BY_TRADE: Record<string, string[]> = {
    "Carpentry": ["Framing", "Finish Carpentry", "Cabinet Installation", "Door & Window Trim", "Decking", "Formwork"],
    "Electrical": ["Residential Wiring", "Commercial Wiring", "Panel Installation", "Conduit Bending", "Low Voltage", "Solar"],
    "Plumbing": ["Rough-In Plumbing", "Finish Plumbing", "Water Heater", "Drain & Sewer", "Gas Lines", "Sprinkler Systems"],
    "HVAC": ["Duct Installation", "Refrigeration", "Boiler Systems", "Air Handler", "Controls & Thermostats"],
    "Masonry": ["Brick Laying", "Block Work", "Stone Work", "Tuckpointing", "Stucco"],
    "Painting": ["Interior Painting", "Exterior Painting", "Spray Painting", "Epoxy Coatings", "Wallpaper"],
    "Roofing": ["Shingle Installation", "Metal Roofing", "Flat Roofing", "Gutters", "Flashing"],
    "Drywall": ["Hanging", "Taping", "Finishing", "Texture"],
    "Flooring": ["Hardwood", "Tile", "Carpet", "LVP/Laminate", "Epoxy"],
    "Welding": ["MIG", "TIG", "Stick", "Structural", "Pipe"],
    "Concrete": ["Flatwork", "Forming", "Finishing", "Stamped Concrete", "Shotcrete"],
    "Landscaping": ["Installation", "Maintenance", "Irrigation", "Hardscaping", "Tree Work"],
    "General Labor": ["Site Cleanup", "Material Handling", "Demo", "Trenching", "Flagging"],
    "Equipment Operation": ["Forklift", "Skid Steer", "Excavator", "Crane", "Aerial Lift"],
    "Insulation": ["Batt Insulation", "Spray Foam", "Blown-In", "Rigid Board"],
    "Glazing": ["Window Installation", "Storefront", "Curtain Wall", "Mirrors"],
    "Other": []
};

const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Somali", "Hmong", "Arabic", "Vietnamese", "Polish", "Other"];
const PROFICIENCY = ["Minimal", "Basic Conversation", "Fluent"];

interface Skill { name: string; yearsExp: number }
interface Language { name: string; proficiency: string }
interface Certification { name: string }

interface WorkerProfile {
    trade?: string;
    skills?: Skill[];
    tools_equipment?: string;
    languages?: Language[];
    certifications?: Certification[];
    photo_url?: string;
}

export function WorkerSkillsForm({ initialData }: { initialData?: WorkerProfile }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [trade, setTrade] = useState(initialData?.trade || "");
    const [skills, setSkills] = useState<Skill[]>(initialData?.skills || []);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [skillYears, setSkillYears] = useState(1);
    const [toolsEquipment, setToolsEquipment] = useState(initialData?.tools_equipment || "");
    const [languages, setLanguages] = useState<Language[]>(initialData?.languages || []);
    const [selectedLang, setSelectedLang] = useState("");
    const [selectedProficiency, setSelectedProficiency] = useState("Fluent");
    const [certifications, setCertifications] = useState<Certification[]>(initialData?.certifications || []);
    const [certName, setCertName] = useState("");
    const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || "");

    const availableSkills = SKILLS_BY_TRADE[trade] || [];

    const addSkill = () => {
        if (!selectedSkill) return;
        if (skills.find(s => s.name === selectedSkill)) return;
        setSkills([...skills, { name: selectedSkill, yearsExp: skillYears }]);
        setSelectedSkill("");
        setSkillYears(1);
    };

    const removeSkill = (name: string) => setSkills(skills.filter(s => s.name !== name));

    const addLanguage = () => {
        if (!selectedLang) return;
        if (languages.find(l => l.name === selectedLang)) return;
        setLanguages([...languages, { name: selectedLang, proficiency: selectedProficiency }]);
        setSelectedLang("");
    };

    const removeLanguage = (name: string) => setLanguages(languages.filter(l => l.name !== name));

    const addCert = () => {
        if (!certName.trim()) return;
        setCertifications([...certifications, { name: certName.trim() }]);
        setCertName("");
    };

    const removeCert = (name: string) => setCertifications(certifications.filter(c => c.name !== name));

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const ext = file.name.split('.').pop();
            const path = `worker-photos/${user.id}.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            setPhotoUrl(data.publicUrl);
            toast({ title: "Photo uploaded!" });
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Try update first; if no rows affected, insert
            const { data: existing } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();

            if (existing) {
                const { error } = await supabase.from('worker_profiles').update({
                    trade,
                    skills: skills as any,
                    tools_equipment: toolsEquipment,
                    languages: languages as any,
                    certifications: certifications as any,
                    photo_url: photoUrl,
                    updated_at: new Date().toISOString()
                }).eq('user_id', user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('worker_profiles').insert({
                    user_id: user.id,
                    trade,
                    skills: skills as any,
                    tools_equipment: toolsEquipment,
                    languages: languages as any,
                    certifications: certifications as any,
                    photo_url: photoUrl,
                } as any);
                if (error) throw error;
            }

            toast({ title: "Profile saved!", description: "Your skills and profile have been updated." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Profile Photo</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-blue-100 border-2 border-blue-200 overflow-hidden flex items-center justify-center">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-blue-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Upload a professional photo</p>
                            <p className="text-xs text-gray-500 mt-0.5">JPG or PNG, max 5MB. Shown on your public marketplace profile.</p>
                            <Button type="button" variant="outline" size="sm" className="mt-2 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                {uploading ? "Uploading..." : "Choose Photo"}
                            </Button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                </CardContent>
            </Card>

            {/* Trade & Skills */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Trade & Skills</CardTitle>
                    <p className="text-sm text-gray-500">Select your primary trade and the skills you are proficient in.</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Primary Trade</Label>
                        <Select value={trade} onValueChange={(v) => { setTrade(v); setSkills([]); setSelectedSkill(""); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your trade..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {trade && availableSkills.length > 0 && (
                        <div className="space-y-3">
                            <Label>Skills</Label>
                            <div className="flex gap-2">
                                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Pick a skill..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSkills.filter(s => !skills.find(sk => sk.name === s)).map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={skillYears}
                                    onChange={e => setSkillYears(parseInt(e.target.value) || 1)}
                                    className="w-20"
                                    placeholder="Yrs"
                                    title="Years of experience"
                                />
                                <Button type="button" onClick={addSkill} variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-gray-400">Enter the number of years of experience for each skill.</p>
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {skills.map(s => (
                                        <Badge key={s.name} variant="secondary" className="text-sm py-1 pl-3 pr-1.5">
                                            {s.name} <span className="text-gray-400 mx-1">•</span> {s.yearsExp}yr{s.yearsExp !== 1 ? "s" : ""}
                                            <button type="button" onClick={() => removeSkill(s.name)} className="ml-1.5 text-gray-400 hover:text-red-500 transition"><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tools & Equipment */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Tools & Equipment</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Textarea
                        value={toolsEquipment}
                        onChange={e => setToolsEquipment(e.target.value)}
                        placeholder="e.g. I own a full set of hand tools, power tools, and a nail gun. I also have a truck and can transport materials."
                        rows={3}
                        className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Describe the tools and equipment you bring to job sites.</p>
                </CardContent>
            </Card>

            {/* Languages */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Languages</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <div className="flex gap-2">
                        <Select value={selectedLang} onValueChange={setSelectedLang}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a language..." />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.filter(l => !languages.find(lx => lx.name === l)).map(l => (
                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedProficiency} onValueChange={setSelectedProficiency}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROFICIENCY.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button type="button" onClick={addLanguage} variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {languages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {languages.map(l => (
                                <Badge key={l.name} variant="outline" className="text-sm py-1 pl-3 pr-1.5">
                                    {l.name} <span className="text-gray-400 mx-1">·</span> {l.proficiency}
                                    <button type="button" onClick={() => removeLanguage(l.name)} className="ml-1.5 text-gray-400 hover:text-red-500 transition"><X className="h-3 w-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={certName}
                            onChange={e => setCertName(e.target.value)}
                            placeholder="e.g. OSHA 10, First Aid, Forklift License..."
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
                        />
                        <Button type="button" onClick={addCert} variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {certifications.map(c => (
                                <Badge key={c.name} className="bg-green-50 text-green-800 border-green-200 text-sm py-1 pl-3 pr-1.5">
                                    {c.name}
                                    <button type="button" onClick={() => removeCert(c.name)} className="ml-1.5 text-green-500 hover:text-red-500 transition"><X className="h-3 w-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={loading || !trade}>
                    {loading ? "Saving..." : "Save Profile"}
                </Button>
            </div>
        </form>
    );
}
