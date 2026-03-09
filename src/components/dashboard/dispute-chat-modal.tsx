"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageSquare, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

interface Message {
    id: string;
    message: string;
    sender_id: string;
    sender_company_id: string;
    is_system_message: boolean;
    created_at: string;
    sender_name?: string;
}

interface DisputeChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeEntryId: string;
    currentCompanyId: string;
}

export function DisputeChatModal({ isOpen, onClose, timeEntryId, currentCompanyId }: DisputeChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("dispute_messages")
                .select("*, users:sender_id(full_name)")
                .eq("time_entry_id", timeEntryId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            setMessages(
                (data || []).map((msg: any) => ({
                    ...msg,
                    sender_name: msg.users?.full_name || "Unknown User",
                }))
            );
        } catch (error: any) {
            console.error("Failed to fetch dispute messages:", error);
            toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && timeEntryId) {
            setIsLoading(true);
            fetchMessages();

            // Subscribe to real-time updates
            const channel = supabase
                .channel(`dispute_chat_${timeEntryId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'dispute_messages',
                        filter: `time_entry_id=eq.${timeEntryId}`,
                    },
                    (payload) => {
                        // Fetch the full message with user name if possible, or just append the raw payload
                        fetchMessages();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, timeEntryId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("dispute_messages").insert({
                time_entry_id: timeEntryId,
                sender_id: user.id,
                sender_company_id: currentCompanyId,
                message: newMessage.trim(),
                is_system_message: false,
            });

            if (error) throw error;
            setNewMessage("");
            // The real-time subscription will pick up the new message and update the UI
        } catch (error: any) {
            console.error("Failed to send message:", error);
            toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="p-4 border-b bg-gray-50 flex-none">
                    <DialogTitle className="flex items-center text-lg">
                        <ShieldAlert className="w-5 h-5 text-red-500 mr-2" />
                        Dispute Resolution
                    </DialogTitle>
                    <DialogDescription>
                        Communicate directly to resolve this timesheet discrepancy.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                            <p className="text-sm">No messages yet. Start the conversation.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_company_id === currentCompanyId;
                            const isSystem = msg.is_system_message;

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-4">
                                        <div className="bg-orange-100 text-orange-800 text-xs px-3 py-1.5 rounded-full font-medium border border-orange-200">
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline space-x-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t flex-none">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            disabled={isSending || isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0"
                            disabled={!newMessage.trim() || isSending || isLoading}
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white ml-0.5" />}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
