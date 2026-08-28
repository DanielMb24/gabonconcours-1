import { api } from "@/services/api.ts";

// --- TYPES ---
export interface SubAdmin {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    etablissement_id: number;
    created_by: number;
    admin_role: "applications_manager" | "documents_validator" | "documents_viewer" | "grades_entry" | "grades_validator" | "payments_viewer" | "reports_viewer" | "messaging_agent";
}

export interface CreateSubAdminInput {
    etablissement_id: number;
    created_by: number;
    nom: string;
    prenom: string;
    email: string;
    password?: string;
    admin_role: "applications_manager" | "documents_validator" | "documents_viewer" | "grades_entry" | "grades_validator" | "payments_viewer" | "reports_viewer" | "messaging_agent";
}

export const subAdminService = {
    async getAll(etablissement_id: number): Promise<{ data: SubAdmin[] }> {
        return api.get('/subadmins', { params: { etablissement_id } });
    },

    async create(payload: CreateSubAdminInput): Promise<{ data: SubAdmin }> {
        return api.post('/subadmins', payload);
    },

    async delete(id: number): Promise<void> {
        return api.delete(`/subadmins/${id}`);
    },
};
