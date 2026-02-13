"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { Check, Upload } from "lucide-react";

export default function WorkerProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>({
        trade: "",
        years_experience: "",
        skills: "", // Comma separated for MVP
        tools: "",
        zip_code: "",
        travel_radius: 50,
        bio: "",
        photo_url: ""
    });
    const [mobile, setMobile] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        // Fetch user for mobile number
        const { data: userData } = await supabase.from('users').select('mobile_number').eq('id', user.id).single();
        if (userData) setMobile(userData.mobile_number || "");

        // Fetch profile
        const { data: profileData } = await supabase.from('worker_profiles').select('*').eq('user_id', user.id).single();
        if (profileData) {
            setProfile({
                trade: profileData.trade || "",
                // Handle complex JSONB - simplified for form
                // skills: (profileData.skills as string[])?.join(", ") || "",
                skills: Array.isArray(profileData.skills) ? profileData.skills.join(", ") : "",
                tools: profileData.tools_equipment || "",
                zip_code: profileData.home_zip_code || "",
                travel_radius: profileData.max_travel_distance_miles || 50,
                bio: "",  // Add bio if added to schema, currently not in schema-marketplace? 
                // Wait, schema-marketplace I wrote has `tools_equipment` but I didn't add `bio` explicitly?
                // I added `tools_equipment`. I'll use that as the bio/description field.
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/workers/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobile_number: mobile,
                    ...profile,
                    skills: profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
                }),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            // Show success logic or redirect
            alert("Profile saved successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error saving profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.photo_url} />
                    <AvatarFallback>Me</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold">Your Profile</h1>
                    <p className="text-muted-foreground">Complete your profile to get matched with jobs.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="mobile">Mobile Number (Required)</Label>
                            <Input
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                required
                            />
                            <p className="text-xs text-muted-foreground">Used for job alerts and coordination.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Primary Trade</Label>
                            <Select
                                value={profile.trade}
                                onValueChange={(val) => setProfile({ ...profile, trade: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your trade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Carpenter">Carpenter</SelectItem>
                                    <SelectItem value="Electrician">Electrician</SelectItem>
                                    <SelectItem value="Plumber">Plumber</SelectItem>
                                    <SelectItem value="Laborer">General Laborer</SelectItem>
                                    <SelectItem value="Painter">Painter</SelectItem>
                                    <SelectItem value="HVAC">HVAC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="skills">Skills (Comma Separated)</Label>
                            <Input
                                id="skills"
                                value={profile.skills}
                                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                placeholder="Framing, Drywall, Finish Carpentry..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="tools">Tools & Equipment</Label>
                            <Textarea
                                id="tools"
                                value={profile.tools}
                                onChange={(e) => setProfile({ ...profile, tools: e.target.value })}
                                placeholder="I have my own hand tools, drill, circular saw..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="zip">Home Zip Code</Label>
                                <Input
                                    id="zip"
                                    value={profile.zip_code}
                                    onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
                                    placeholder="12345"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="radius">Travel Radius (Miles)</Label>
                                <Select
                                    value={String(profile.travel_radius)}
                                    onValueChange={(val) => setProfile({ ...profile, travel_radius: parseInt(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select radius" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 Miles</SelectItem>
                                        <SelectItem value="25">25 Miles</SelectItem>
                                        <SelectItem value="50">50 Miles</SelectItem>
                                        <SelectItem value="75">75 Miles</SelectItem>
                                        <SelectItem value="100">100+ Miles</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
