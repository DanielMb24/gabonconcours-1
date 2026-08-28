import { api, apiService } from './api';
import { candidatePortalRoutes } from './candidatePortalService';

export interface Document {
  id: string;
  nomdoc: string;
  type?: string;
  document_statut: 'valide' | 'rejete' | 'en_attente';
  url: string;
  taille?: number;
  requirement_id?: string | null;
  obligatoire?: boolean;
  commentaire_validation?: string;
  nom_fichier?: string;
  mime_type?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentRequirement {
  id: string;
  code: string;
  nom: string;
  description: string;
  obligatoire: boolean;
  acceptedMimeTypes: string[];
  maxSizeBytes: number;
}

export interface DocumentChecklist {
  nupcan: string;
  checklist: Array<{ requirement: DocumentRequirement; document: Document | null }>;
  supplemental: Document[];
  summary: { required: number; submitted: number; approved: number; missing: number; rejected: number };
}

const mapDocument = (doc: any): Document => ({
  id: String(doc.id), nomdoc: doc.nomdoc, type: doc.nom_fichier || doc.type,
  document_statut: doc.document_statut || doc.statut || 'en_attente',
  url: doc.docdsr || doc.nom_fichier || '', taille: doc.taille,
  requirement_id: doc.requirement_id, obligatoire: doc.obligatoire,
  commentaire_validation: doc.commentaire_validation, nom_fichier: doc.nom_fichier,
  mime_type: doc.mime_type, version: doc.version, created_at: doc.created_at, updated_at: doc.updated_at,
});

export interface DocumentData {
  id: string | number;
  nomdoc: string;
  type?: string;
  statut: 'valide' | 'rejete' | 'en_attente';
  document_statut?: 'valide' | 'rejete' | 'en_attente';
  docdsr?: string;
  nom_fichier?: string;
  url?: string;
  taille?: number;
  taille_fichier?: number;
  chemin_fichier?: string;
  commentaire_validation?: string;
  create_at?: string;
  created_at?: string;
}

export const documentService = {
  async getDocumentsByNupcan(nupcan: string): Promise<Document[]> {
    try {
      const response = await api.get(candidatePortalRoutes.documents(nupcan));
      return response.data.data.map(mapDocument);
    } catch (error) {
      console.error('Error fetching documents by nupcan:', error);
      throw new Error('Failed to fetch documents');
    }
  },

  async getChecklist(nupcan: string): Promise<DocumentChecklist> {
    const response = await api.get(candidatePortalRoutes.documentChecklist(nupcan));
    const data = response.data.data || {};
    const checklist = Array.isArray(data.checklist) ? data.checklist : [];
    const supplemental = Array.isArray(data.supplemental) ? data.supplemental : [];
    const summary = data.summary || { required: 0, submitted: 0, approved: 0, missing: 0, rejected: 0 };
    return {
      nupcan: data.nupcan || nupcan,
      checklist: checklist.map((item: any) => ({ requirement: item.requirement, document: item.document ? mapDocument(item.document) : null })),
      supplemental: supplemental.map(mapDocument),
      summary,
    };
  },

  async uploadDocument(formData: FormData): Promise<Document> {
    try {
      const response = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const doc = response.data.data;
      return {
        id: doc.id.toString(),
        nomdoc: doc.nomdoc,
        type: doc.type,
        document_statut: doc.statut || 'en_attente',
        url: doc.docdsr || doc.nom_fichier,
        taille: doc.taille,
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw new Error(error.response?.data?.message || 'Échec du téléversement du document');
    }
  },

  async replaceDocument(id: string, data: File | FormData): Promise<Document> {
    try {
      let formData: FormData;

      if (data instanceof FormData) {
        formData = data;
      } else {
        formData = new FormData();
        formData.append('file', data);
      }

      console.log('Remplacement document ID:', id);
      const response = await api.put(`/documents/${id}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Réponse remplacement:', response.data);
      const doc = response.data.data;

     return {
  id: doc.id?.toString() || id,
  nomdoc: doc.nomdoc || '',
  type: doc.type || '',
  document_statut: doc.statut || doc.document_statut || 'en_attente',
  url: doc.docdsr || doc.nom_fichier || doc.chemin_fichier || '',
  taille: doc.taille || doc.taille_fichier || 0,
  docdsr: doc.docdsr || '',
};

    } catch (error: any) {
      console.error('Erreur lors du remplacement du document :', error);
      throw new Error(error.response?.data?.message || 'Échec du remplacement du document');
    }
  },

  async updateDocument(id: string, file: File): Promise<Document> {
    return this.replaceDocument(id, file);
  },

  async renameDocument(id: string, nomdoc: string): Promise<Document> {
    const response = await api.patch(`/documents/${id}`, { nomdoc });
    return mapDocument(response.data.data);
  },

  async updateDocumentStatus(id: string, statut: string, commentaire?: string): Promise<any> {
    try {
      const response = await api.put(`/documents/${id}/status`, { statut, commentaire });
      return response.data;
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      throw new Error(error.response?.data?.message || 'Échec de la mise à jour du statut');
    }
  },

  async deleteDocument(nupcan: string, documentId: string): Promise<void> {
    try {
      console.log('Suppression document:', documentId);
      const response = await apiService.makeRequest(`/documents/${documentId}`, 'DELETE');
      if (!response.success) throw new Error(response.message);
    } catch (error) {
      console.error('Erreur suppression document:', error);
      throw error;
    }
  },

  async getDocumentsByCandidat(nupcan: string): Promise<any> {
    return this.getDocumentsByNupcan(nupcan);
  },

  async validateDocument(documentId: string, validationData: any): Promise<any> {
    try {
      const response = await api.put(`/documents/${documentId}/status`, {
        statut: validationData.statut,
        commentaire: validationData.commentaire,
      });
      return response.data;
    } catch (error) {
      console.error('Error validating document:', error);
      throw new Error('Failed to validate document');
    }
  },

  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/documents/${documentId}/download`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.blob();
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  },

  getDocumentPreviewUrl(documentId: string): string {
    return `${api.defaults.baseURL}/documents/${documentId}/download`;
  },
};
