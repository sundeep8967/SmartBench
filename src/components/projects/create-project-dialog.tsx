"use client";

import { useState, useEffect } from "react";
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
import { LocationPickerMap } from "@/components/ui/location-picker-map";
import { createProjectAction } from "@/app/dashboard/projects/actions";

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated?: () => void } = {}) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [isPinMoved, setIsPinMoved] = useState(false);
    const [isPinConfirmed, setIsPinConfirmed] = useState(false);

    useEffect(() => {
        if (open) {
            setIsPinMoved(false);
            setIsPinConfirmed(false);
        }
    }, [open]);

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
                            onChange={(address, components) => {
                                setIsPinMoved(false);
                                setIsPinConfirmed(false);
                                setFormData(prev => ({
                                    ...prev,
                                    address,
                                    lat: components?.lat,
                                    lng: components?.lng
                                }));
                            }}
                            required
                        />
                    </div>

                    {formData.lat !== undefined && formData.lng !== undefined && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Confirm Pin Location</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={isPinConfirmed ? "outline" : "default"}
                                    className={isPinConfirmed ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800" : ""}
                                    disabled={!isPinMoved || isPinConfirmed}
                                    onClick={() => setIsPinConfirmed(true)}
                                >
                                    {isPinConfirmed ? "Confirmed ✓" : "Confirm Pin"}
                                </Button>
                            </div>
                            <LocationPickerMap
                                lat={formData.lat}
                                lng={formData.lng}
                                onChange={(lat, lng, address) => {
                                    setIsPinMoved(true);
                                    setIsPinConfirmed(false);
                                    setFormData(prev => ({
                                        ...prev,
                                        lat,
                                        lng,
                                        ...(address ? { address } : {})
                                    }))
                                }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="daily_start_time">Earliest Start Time</Label>
                            <Input
                                id="daily_start_time"
                                type="time"
                                value={formData.daily_start_time}
                                onChange={(e) => handleChange('daily_start_time', e.target.value)}
                                required
                            />
                        </div>

                    </div>

                    {/* Timezone — Central locked for MVP; other zones disabled with lock icon */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-gray-700">Timezone</Label>
                        <Select value="America/Chicago" onValueChange={() => { }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="America/Chicago">Central — Chicago / Minneapolis</SelectItem>
                                <SelectItem value="America/New_York" disabled>
                                    <span className="flex items-center justify-between w-full gap-4">
                                        Eastern — New York <span className="text-gray-400">🔒</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="America/Denver" disabled>
                                    <span className="flex items-center justify-between w-full gap-4">
                                        Mountain — Denver <span className="text-gray-400">🔒</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="America/Los_Angeles" disabled>
                                    <span className="flex items-center justify-between w-full gap-4">
                                        Pacific — Los Angeles <span className="text-gray-400">🔒</span>
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">Other timezones coming soon.</p>
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
                        <Button type="submit" disabled={loading || (formData.lat !== undefined && !isPinConfirmed)}>
                            {loading ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
