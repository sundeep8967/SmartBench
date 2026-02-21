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
import { CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { createProjectAction } from "@/app/dashboard/projects/actions";

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated?: () => void } = {}) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        address: "",
        timezone: "America/Chicago",
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createProjectAction({
                ...formData,
                start_date: formData.start_date ? formData.start_date.toISOString() : undefined,
                end_date: formData.end_date ? formData.end_date.toISOString() : undefined
            });

            toast({ title: "Success", description: "Project created successfully." });
            setOpen(false);
            setFormData({
                name: "",
                description: "",
                address: "",
                timezone: "America/Chicago",
                start_date: undefined,
                end_date: undefined
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
                        <Input id="address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="123 Main St, City, State" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <DatePicker
                                value={formData.start_date}
                                onChange={(date) => handleChange('start_date', date)}
                                placeholder="Select start date"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <DatePicker
                                value={formData.end_date}
                                onChange={(date) => handleChange('end_date', date)}
                                placeholder="Select end date"
                            />
                        </div>
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

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Brief details about the project scope..." />
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
