import { createClient } from "@/lib/supabase/server";

export type Role = 'Admin' | 'Manager' | 'Worker' | 'Supervisor';

export async function getCurrentUserRole(userId: string, companyId: string): Promise<Role[]> {
    const supabase = await createClient();

    const { data: member, error } = await supabase
        .from('company_members')
        .select('roles')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('status', 'Active')
        .single();

    if (error || !member) {
        return [];
    }

    // Ensure roles are strings and normalize to Title Case (admin -> Admin)
    return (member.roles as unknown as string[]).map(r => {
        const roleStr = String(r);
        // Capitalize first letter, lowercase rest
        return (roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase()) as Role;
    });
}

export async function verifyRole(userId: string, companyId: string, allowedRoles: Role[]): Promise<boolean> {
    const userRoles = await getCurrentUserRole(userId, companyId);
    // Comparison is now safe because userRoles are normalized
    return userRoles.some(role => allowedRoles.includes(role));
}

export function hasRole(userRoles: Role[], requiredRoles: Role[]): boolean {
    return userRoles.some(role => requiredRoles.includes(role));
}
