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
import { CalendarIcon, Plus, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkOrderDialogProps {
    projectId: string;
}

export function WorkOrderDialog({ projectId }: WorkOrderDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        role: "",
        quantity: 1,
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        start_time: "07:00",
        end_time: "15:30",
        description: "",
        hourly_rate_min: "",
        hourly_rate_max: ""
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/projects/${projectId}/work-orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    start_date: formData.start_date?.toISOString(),
                    end_date: formData.end_date?.toISOString(),
                    hourly_rate_min: formData.hourly_rate_min ? parseFloat(formData.hourly_rate_min) : null,
                    hourly_rate_max: formData.hourly_rate_max ? parseFloat(formData.hourly_rate_max) : null
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create work order");
            }

            toast({ title: "Success", description: "Work Order created successfully." });
            setOpen(false);
            setFormData({
                role: "",
                quantity: 1,
                start_date: undefined,
                end_date: undefined,
                start_time: "07:00",
                end_time: "15:30",
                description: "",
                hourly_rate_min: "",
                hourly_rate_max: ""
            });
            router.refresh();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Work Order</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Work Order</DialogTitle>
                    <DialogDescription>
                        Define labor requirements for this project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role / Trade</Label>
                            <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                                <SelectTrigger> <SelectValue placeholder="Select trade" /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General Laborer">General Laborer</SelectItem>
                                    <SelectItem value="Carpenter - Framer">Carpenter - Framer</SelectItem>
                                    <SelectItem value="Carpenter - Finish">Carpenter - Finish</SelectItem>
                                    <SelectItem value="Electrician">Electrician</SelectItem>
                                    <SelectItem value="Plumber">Plumber</SelectItem>
                                    <SelectItem value="Drywall Hanger">Drywall Hanger</SelectItem>
                                    <SelectItem value="Painter">Painter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity Needed</Label>
                            <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value))} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.start_date} onSelect={(d) => handleChange('start_date', d)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.end_date ? format(formData.end_date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.end_date} onSelect={(d) => handleChange('end_date', d)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Shift Start Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="start_time" type="time" className="pl-8" value={formData.start_time} onChange={(e) => handleChange('start_time', e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">Shift End Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="end_time" type="time" className="pl-8" value={formData.end_time} onChange={(e) => handleChange('end_time', e.target.value)} required />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hourly_rate_min">Min Hourly Rate ($)</Label>
                            <Input id="hourly_rate_min" type="number" min="0" step="0.50" value={formData.hourly_rate_min} onChange={(e) => handleChange('hourly_rate_min', e.target.value)} placeholder="Optional" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hourly_rate_max">Max Hourly Rate ($)</Label>
                            <Input id="hourly_rate_max" type="number" min="0" step="0.50" value={formData.hourly_rate_max} onChange={(e) => handleChange('hourly_rate_max', e.target.value)} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Job Description / Requirements</Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="e.g. bring own tools, safety vest required." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Work Order"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
