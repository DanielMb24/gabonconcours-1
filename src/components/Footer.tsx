import React from 'react';
import { Link } from 'react-router-dom';
import GabonFlag from './GabonFlag';
import {
    GraduationCap,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Linkedin
} from 'lucide-react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white text-slate-900 border-t border-slate-200">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* À propos */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">GABConcours</span>
                        </div>
                        <p className="text-slate-600 text-sm">
                            Service numérique de candidature aux concours d'entrée dans les établissements d'enseignement supérieur au Gabon.
                        </p>
                        <div className="flex space-x-3">
                                <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                                <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                                <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                                <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Liens rapides */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Liens rapides</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-slate-600 hover:text-primary transition-colors flex items-center">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link to="/concours" className="text-slate-600 hover:text-primary transition-colors flex items-center">
                                    Concours disponibles
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-600 hover:text-primary transition-colors flex items-center">
                                    À propos
                                </Link>
                            </li>
                            <li>
                                <Link to="/support" className="text-slate-600 hover:text-primary transition-colors flex items-center">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/connexion" className="text-slate-600 hover:text-primary transition-colors flex items-center">
                                    Connexion
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Services</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                                    Candidature en ligne
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                                    Suivi de dossier
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                                    Paiement sécurisé
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                                    Résultats
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                                    Support 24/7
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600 text-sm">
                  Libreville, Gabon<br />
                  BP 1234
                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                                <span className="text-slate-600 text-sm">
                  +241 74604327
                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                                <a href="mailto:contact@gabconcours.ga" className="text-slate-600 hover:text-primary text-sm">
                                    contact@gabconcours.ga
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="flex items-center gap-2 text-slate-500 text-sm text-center md:text-left">
                            <GabonFlag width={22} />
                            © {currentYear} GABConcours. Tous droits réservés.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <Link to="/privacy" className="text-slate-500 hover:text-primary transition-colors">
                                Politique de confidentialité
                            </Link>
                            <Link to="/terms" className="text-slate-500 hover:text-primary transition-colors">
                                Conditions d'utilisation
                            </Link>
                            <Link to="/legal" className="text-slate-500 hover:text-primary transition-colors">
                                Mentions légales
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
