import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Download, Mail, FileText, Send} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import jsPDF from 'jspdf';

interface BeautifulReceiptPDFProps {
    candidatureData: {
        candidat: any;
        concours: any;
        paiement: any;
        documents: any[];
        filiere?: any;
    };
    onDownload?: () => void;
}

const BeautifulReceiptPDF: React.FC<BeautifulReceiptPDFProps> = ({
                                                                     candidatureData,
                                                                     onDownload
                                                                 }) => {
    const [emailDialog, setEmailDialog] = useState(false);
    const [email, setEmail] = useState(candidatureData.candidat?.maican || '');
    const [sending, setSending] = useState(false);

    const generateBeautifulPDF = () => {
        const doc = new jsPDF();
        const {candidat, concours, paiement, documents, filiere} = candidatureData;

        // Configuration des couleurs
        const primaryColor = [37, 99, 235]; // Bleu primary
        const secondaryColor = [100, 116, 139]; // Gris
        const accentColor = [16, 185, 129]; // Vert

        // En-tête avec design moderne
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 35, 'F');

        // Logo et titre
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('GABConcours', 20, 25);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Service numérique de candidature', 130, 20);
        doc.text('République Gabonaise', 130, 28);

        // Titre du document
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE CANDIDATURE', 105, 55, {align: 'center'});

        // Ligne décorative
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(2);
        doc.line(20, 65, 190, 65);

        let yPos = 80;

        // Section Candidat avec fond coloré
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 60, 'F');

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('👤 INFORMATIONS DU CANDIDAT', 20, yPos + 5);

        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const candidatInfo = [
            `• NUPCAN: ${candidat.nupcan}`,
            `• Nom complet: ${candidat.prncan} ${candidat.nomcan}`,
            `• Email: ${candidat.maican}`,
            `• Téléphone: ${candidat.telcan}`,
            `• Date de naissance: ${new Date(candidat.dtncan).toLocaleDateString('fr-FR')}`,
            `• Lieu de naissance: ${candidat.ldncan || 'N/A'}`
        ];

        candidatInfo.forEach(info => {
            doc.text(info, 25, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Section Concours
        doc.setFillColor(250, 250, 255);
        doc.rect(15, yPos - 5, 180, 50, 'F');

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('🏫 INFORMATIONS DU CONCOURS', 20, yPos + 5);

        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const isGratuit = !concours.fracnc || parseFloat(concours.fracnc) === 0;
        const concoursInfo = [
            `• Concours: ${concours.libcnc}`,
            `• Établissement: ${concours.etablissement_nomets}`,
            `• Session: ${concours.sescnc || 'N/A'}`,
            `• Frais d'inscription: ${isGratuit ? 'GRATUIT (Programme NGORI)' : `${concours.fracnc} FCFA`}`
        ];

        concoursInfo.forEach(info => {
            doc.text(info, 25, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Section Filière et Matières
        if (filiere) {
            doc.setFillColor(255, 250, 240);
            doc.rect(15, yPos - 5, 180, 70, 'F');

            doc.setTextColor(37, 99, 235);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('📚 FILIÈRE ET MATIÈRES', 20, yPos + 5);

            yPos += 15;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Filière: ${filiere.nomfil}`, 25, yPos);
            yPos += 8;

            if (filiere.description) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Description: ${filiere.description}`, 25, yPos);
                yPos += 8;
            }

            if (filiere.matieres && filiere.matieres.length > 0) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Matières d\'étude:', 25, yPos);
                yPos += 8;

                doc.setFont('helvetica', 'normal');
                filiere.matieres.forEach((matiere: any, index: number) => {
                    const matiereText = `  ${index + 1}. ${matiere.nom_matiere} (Coefficient: ${matiere.coefficient})${matiere.obligatoire ? ' - Obligatoire' : ''}`;
                    doc.text(matiereText, 25, yPos);
                    yPos += 6;
                });
            }
            yPos += 10;
        }

        // Section Paiement
        if (paiement) {
            doc.setFillColor(240, 255, 240);
            doc.rect(15, yPos - 5, 180, 45, 'F');

            doc.setTextColor(37, 99, 235);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('💳 INFORMATIONS DE PAIEMENT', 20, yPos + 5);

            yPos += 15;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            const paiementInfo = [
                `• Statut: ${paiement.statut}`,
                `• Montant: ${paiement.montant} FCFA`,
                `• Méthode: ${paiement.methode || 'N/A'}`,
                `• Référence: ${paiement.reference_paiement || paiement.reference || 'N/A'}`,
                `• Date: ${new Date(paiement.created_at || paiement.date_paiement).toLocaleDateString('fr-FR')}`
            ];

            paiementInfo.forEach(info => {
                doc.text(info, 25, yPos);
                yPos += 6;
            });
            yPos += 10;
        }

        // Section Documents
        if (documents && documents.length > 0) {
            doc.setFillColor(255, 245, 245);
            doc.rect(15, yPos - 5, 180, Math.min(50, documents.length * 6 + 20), 'F');

            doc.setTextColor(37, 99, 235);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('📄 DOCUMENTS SOUMIS', 20, yPos + 5);

            yPos += 15;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            documents.forEach((document, index) => {
                const statut = document.statut || document.document_statut;
                const statusIcon = statut === 'valide' ? '✅' : statut === 'rejete' ? '❌' : '⏳';
                doc.text(`  ${statusIcon} ${index + 1}. ${document.type || document.nomdoc} - ${statut}`, 25, yPos);
                yPos += 6;
            });
        }

        // Pied de page avec design moderne
        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(37, 99, 235);
        doc.rect(0, pageHeight - 30, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Ce document certifie l\'inscription du candidat au concours mentionné ci-dessus.', 105, pageHeight - 20, {align: 'center'});
        doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, pageHeight - 12, {align: 'center'});
        doc.text('GABConcours - Service numérique de candidature - République Gabonaise', 105, pageHeight - 4, {align: 'center'});

        // Télécharger le PDF
        doc.save(`recu-candidature-${candidat.nupcan}.pdf`);

        toast({
            title: "PDF généré avec succès",
            description: "Le reçu a été téléchargé avec toutes les informations",
        });

        if (onDownload) {
            onDownload();
        }
    };

    const handleSendEmail = async () => {
        if (!email) {
            toast({
                title: "Email requis",
                description: "Veuillez saisir une adresse email",
                variant: "destructive",
            });
            return;
        }

        try {
            setSending(true);
            await apiService.sendReceiptByEmail(candidatureData.candidat.nupcan, email);

            toast({
                title: "Email envoyé",
                description: `Le reçu a été envoyé à ${email}`,
            });

            setEmailDialog(false);
        } catch (error) {
            toast({
                title: "Erreur d'envoi",
                description: "Impossible d'envoyer l'email",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5"/>
                    <span>Reçu de candidature</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Téléchargez ou recevez par email votre reçu officiel de candidature avec toutes les informations
                        détaillées.
                    </p>

                    <div className="flex space-x-2">
                        <Button
                            onClick={generateBeautifulPDF}
                            className="flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4"/>
                            <span>Télécharger PDF Complet</span>
                        </Button>

                        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <Mail className="h-4 w-4"/>
                                    <span>Envoyer par email</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Envoyer le reçu par email</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Adresse email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="votre@email.com"
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={handleSendEmail}
                                            disabled={sending}
                                            className="flex items-center space-x-2"
                                        >
                                            {sending ? (
                                                <div
                                                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>
                                            ) : (
                                                <Send className="h-4 w-4"/>
                                            )}
                                            <span>{sending ? 'Envoi...' : 'Envoyer'}</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEmailDialog(false)}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default BeautifulReceiptPDF;
