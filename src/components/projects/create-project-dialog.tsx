"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { AddressInput } from "@/components/ui/address-input";
import { createProjectAction } from "@/app/dashboard/projects/actions";

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated?: () => void } = {}) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        project_description: "",
        address: "",
        lat: undefined as number | undefined,
        lng: undefined as number | undefined,
        timezone: "America/Chicago",
        daily_start_time: "07:00",
        meeting_location_type: "Front of House",
        meeting_instructions: ""
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (formData.lat === undefined || formData.lng === undefined) {
                toast({
                    title: "Invalid Address Selection",
                    description: "Please select an address from the Google Maps dropdown to ensure accurate coordinates.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            await createProjectAction({
                ...formData,
                // Optional format standardizer if needed
            });

            toast({ title: "Success", description: "Project created successfully." });
            setOpen(false);
            setFormData({
                name: "",
                project_description: "",
                address: "",
                lat: undefined,
                lng: undefined,
                timezone: "America/Chicago",
                daily_start_time: "07:00",
                meeting_location_type: "Front of House",
                meeting_instructions: ""
            });
            // router.refresh() is handled automatically by revalidatePath in the server action
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Set up a new job site location.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. Downtown Office Complex" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Site Address</Label>
                        <AddressInput
                            value={formData.address}
                            onChange={(address, lat, lng) => {
                                setFormData(prev => ({ ...prev, address, lat, lng }));
                            }}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="daily_start_time">Shift Start Time</Label>
                            <Input
                                id="daily_start_time"
                                type="time"
                                value={formData.daily_start_time}
                                onChange={(e) => handleChange('daily_start_time', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select value={formData.timezone} onValueChange={(v) => handleChange('timezone', v)}>
                                <SelectTrigger> <SelectValue /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="America/Chicago">Central (Chicago)</SelectItem>
                                    <SelectItem value="America/New_York">Eastern (New York)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain (Denver)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific (Los Angeles)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meeting_location_type">Meeting Point</Label>
                        <Select value={formData.meeting_location_type} onValueChange={(v) => handleChange('meeting_location_type', v)}>
                            <SelectTrigger> <SelectValue /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Front of House">Front of House</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.meeting_location_type === 'Other' && (
                        <div className="space-y-2">
                            <Label htmlFor="meeting_instructions">Meeting Instructions</Label>
                            <Input id="meeting_instructions" value={formData.meeting_instructions} onChange={(e) => handleChange('meeting_instructions', e.target.value)} placeholder="e.g. Go to the back alley and text me" />
                        </div>
                    )}



                    <div className="space-y-2">
                        <Label htmlFor="project_description">Project Description</Label>
                        <Textarea id="project_description" value={formData.project_description} onChange={(e) => handleChange('project_description', e.target.value)} placeholder="Brief details about the project scope..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Project"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
