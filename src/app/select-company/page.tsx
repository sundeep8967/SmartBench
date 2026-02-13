'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, ArrowRight } from 'lucide-react';

interface Company {
    id: string;
    name: string;
    role: string;
}

export default function SelectCompanyPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadCompanies() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch active memberships with company details
                const { data: memberships, error } = await supabase
                    .from('company_members')
                    .select('company_id, roles, companies(name)')
                    .eq('user_id', user.id)
                    .eq('status', 'Active');

                if (error) throw error;

                if (memberships) {
                    const formattedCompanies = memberships.map((m: any) => ({
                        id: m.company_id,
                        name: m.companies?.name || 'Unknown Company',
                        role: Array.isArray(m.roles) ? m.roles[0] : m.roles
                    }));
                    setCompanies(formattedCompanies);

                    // If only 1 company, auto-redirect (failsafe)
                    if (formattedCompanies.length === 1) {
                        // In a real app we might set a cookie here
                        router.push('/dashboard');
                    }
                }
            } catch (err) {
                console.error('Error loading companies:', err);
            } finally {
                setLoading(false);
            }
        }

        loadCompanies();
    }, [router, supabase]);

    const handleSelectCompany = (companyId: string) => {
        // Here you would typically set the active company context
        // For now, we just redirect to dashboard, assuming the app
        // resolves the context or we pass it as a query param if needed.
        // In the future, we might call an API to set the active session company.

        // For MVP: effectively just "enter"
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Select Organization</CardTitle>
                    <CardDescription>
                        You are a member of multiple organizations. Please select one to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {companies.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active organizations found.
                            <Button variant="link" onClick={() => router.push('/onboarding')} className="mt-2 block mx-auto">
                                Go to Onboarding
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {companies.map((company) => (
                                <Button
                                    key={company.id}
                                    variant="outline"
                                    className="h-auto py-4 flex items-center justify-between group hover:border-primary hover:bg-primary/5 transition-all"
                                    onClick={() => handleSelectCompany(company.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-foreground group-hover:text-primary">
                                                {company.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {company.role}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100" />
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
