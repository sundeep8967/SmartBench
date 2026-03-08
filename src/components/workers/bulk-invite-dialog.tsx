'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Loader2, Plus, Minus, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface InviteRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export function BulkInviteWorkerDialog({ onInvitesSent }: { onInvitesSent?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [invites, setInvites] = useState<InviteRow[]>([
        { id: '1', email: '', firstName: '', lastName: '', role: 'Worker' }
    ]);
    const { toast } = useToast();

    const handleAddRow = () => {
        setInvites([
            ...invites,
            { id: Math.random().toString(36).substr(2, 9), email: '', firstName: '', lastName: '', role: 'Worker' }
        ]);
    };

    const handleRemoveRow = (id: string) => {
        if (invites.length === 1) return;
        setInvites(invites.filter(invite => invite.id !== id));
    };

    const handleChange = (id: string, field: keyof InviteRow, value: string) => {
        setInvites(invites.map(invite =>
            invite.id === id ? { ...invite, [field]: value } : invite
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty rows
        const validInvites = invites.filter(i => i.email && i.firstName);

        if (validInvites.length === 0) {
            toast({
                title: 'Error',
                description: 'Please fill out at least one complete row.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/company/bulk-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invites: validInvites }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send bulk invitations');
            }

            toast({
                title: 'Invitations Sent',
                description: data.message,
            });

            if (onInvitesSent) {
                onInvitesSent();
            }

            setOpen(false);
            setInvites([{ id: '1', email: '', firstName: '', lastName: '', role: 'Worker' }]);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Users size={16} className="mr-2" /> Bulk Invite Crew
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Invite Workers</DialogTitle>
                    <DialogDescription>
                        Send email invitations to multiple workers at once. They will receive magic links to complete their onboarding.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto max-h-[400px] px-1 py-4">
                        <div className="space-y-4">
                            {invites.map((invite, index) => (
                                <div key={invite.id} className="flex gap-2 items-start relative group">
                                    <div className="flex-1 grid grid-cols-12 gap-2">
                                        <div className="col-span-3">
                                            {index === 0 && <Label className="text-xs text-gray-500 mb-1 block">First Name <span className="text-red-500">*</span></Label>}
                                            <Input
                                                placeholder="First"
                                                value={invite.firstName}
                                                onChange={(e) => handleChange(invite.id, 'firstName', e.target.value)}
                                                required={!!invite.email || index === 0}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            {index === 0 && <Label className="text-xs text-gray-500 mb-1 block">Last Name</Label>}
                                            <Input
                                                placeholder="Last"
                                                value={invite.lastName}
                                                onChange={(e) => handleChange(invite.id, 'lastName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            {index === 0 && <Label className="text-xs text-gray-500 mb-1 block">Email <span className="text-red-500">*</span></Label>}
                                            <Input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={invite.email}
                                                onChange={(e) => handleChange(invite.id, 'email', e.target.value)}
                                                required={!!invite.firstName || index === 0}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            {index === 0 && <Label className="text-xs text-gray-500 mb-1 block">Role</Label>}
                                            <Select
                                                value={invite.role}
                                                onValueChange={(value) => handleChange(invite.id, 'role', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Worker">Worker</SelectItem>
                                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                                    <SelectItem value="Manager">Manager</SelectItem>
                                                    <SelectItem value="Admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className={`${index === 0 ? 'mt-[22px]' : ''} flex items-center`}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-600 h-10 w-10 shrink-0"
                                            onClick={() => handleRemoveRow(invite.id)}
                                            disabled={invites.length === 1}
                                        >
                                            <Minus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddRow}
                                className="border-dashed"
                            >
                                <Plus size={14} className="mr-1" /> Add Row
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t mt-auto">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send {invites.filter(i => i.email && i.firstName).length || 1} Invitations
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
