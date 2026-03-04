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
import { Pencil } from "lucide-react";
import { AddressInput } from "@/components/ui/address-input";
import { LocationPickerMap } from "@/components/ui/location-picker-map";
import { updateProjectAction } from "@/app/dashboard/projects/actions";
import type { Project } from "@/types";
import tzlookup from "tz-lookup";

export function EditProjectDialog({ project }: { project: Project }) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: project.name,
        project_description: project.project_description || "",
        address: project.address,
        city: "",
        state: "",
        zip: "",
        lat: project.lat as number | undefined,
        lng: project.lng as number | undefined,
        timezone: project.timezone || "America/Chicago",
        daily_start_time: project.daily_start_time || "07:00",
        meeting_location_type: project.meeting_location_type || "Front of House",
        meeting_instructions: project.meeting_instructions || ""
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setFormData({
                name: project.name,
                project_description: project.project_description || "",
                address: project.address,
                city: "",
                state: "",
                zip: "",
                lat: project.lat as number | undefined,
                lng: project.lng as number | undefined,
                timezone: project.timezone || "America/Chicago",
                daily_start_time: project.daily_start_time || "07:00",
                meeting_location_type: project.meeting_location_type || "Front of House",
                meeting_instructions: project.meeting_instructions || ""
            });
        }
        setOpen(isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (formData.lat === undefined || formData.lng === undefined) {
                toast({
                    title: "Invalid Address",
                    description: "Please select an address from the dropdown to ensure accurate coordinates.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            await updateProjectAction(project.id, formData);

            toast({ title: "Success", description: "Project updated successfully." });
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Project
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[525px]"
                onInteractOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.pac-container')) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update the project details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Project Name</Label>
                        <Input id="edit-name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-address">Site Address</Label>
                        <AddressInput
                            value={formData.address}
                            onChange={(address, components) => {
                                // MVP geo-restriction: Minnesota only
                                if (components?.state && components.state !== "Minnesota") {
                                    toast({
                                        title: "📍 Currently Available in Minnesota Only",
                                        description: "SmartBench is currently available in Minnesota, USA. We're expanding soon — stay tuned!",
                                        variant: "destructive",
                                    });
                                    setFormData(prev => ({ ...prev, address: "", lat: undefined, lng: undefined }));
                                    return;
                                }
                                setFormData(prev => ({
                                    ...prev,
                                    address,
                                    city: components?.city || "",
                                    state: components?.state || "",
                                    zip: components?.zipCode || "",
                                    lat: components?.lat,
                                    lng: components?.lng,
                                    timezone: (components?.lat && components?.lng) ? tzlookup(components.lat, components.lng) : "America/Chicago"
                                }));
                            }}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">City</Label>
                            <Input value={formData.city} disabled className="h-8 text-sm bg-gray-50" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">State</Label>
                            <Input value={formData.state} disabled className="h-8 text-sm bg-gray-50" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Zip</Label>
                            <Input value={formData.zip} disabled className="h-8 text-sm bg-gray-50" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Timezone</Label>
                            <Input value={formData.timezone} disabled className="h-8 text-sm bg-gray-50" />
                        </div>
                    </div>

                    {formData.lat !== undefined && formData.lng !== undefined && (
                        <div className="space-y-2">
                            <Label>Confirm Pin Location</Label>
                            <LocationPickerMap
                                lat={formData.lat}
                                lng={formData.lng}
                                onChange={(lat, lng, address, components) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        lat,
                                        lng,
                                        ...(address ? { address } : {}),
                                        ...(components?.city ? { city: components.city } : {}),
                                        ...(components?.state ? { state: components.state } : {}),
                                        ...(components?.zipCode ? { zip: components.zipCode } : {}),
                                        timezone: (lat && lng) ? tzlookup(lat, lng) : "America/Chicago"
                                    }))
                                }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-daily_start_time">Earliest Start Time</Label>
                            <Input
                                id="edit-daily_start_time"
                                type="time"
                                value={formData.daily_start_time}
                                onChange={(e) => handleChange('daily_start_time', e.target.value)}
                                onClick={(e) => {
                                    if ('showPicker' in e.currentTarget) {
                                        (e.currentTarget as any).showPicker();
                                    }
                                }}
                                required
                            />
                        </div>

                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-meeting_location_type">Meeting Point</Label>
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
                            <Label htmlFor="edit-meeting_instructions">Meeting Instructions</Label>
                            <Input id="edit-meeting_instructions" value={formData.meeting_instructions} onChange={(e) => handleChange('meeting_instructions', e.target.value)} placeholder="e.g. Go to the back alley and text me" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-project_description">Project Description</Label>
                        <Textarea id="edit-project_description" value={formData.project_description} onChange={(e) => handleChange('project_description', e.target.value)} placeholder="Brief details about the project scope..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
