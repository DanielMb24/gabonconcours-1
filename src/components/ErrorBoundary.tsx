import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * Filet de sécurité : si une erreur de rendu survient (ex. données API
 * inattendues), affiche un écran de repli avec un bouton de rechargement
 * au lieu d'une page blanche.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: unknown): void {
        console.error('Erreur de rendu interceptée :', error);
    }

    private handleReload = (): void => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: 24 }}>
                    <div style={{ maxWidth: 480, textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 32 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Une erreur est survenue</h1>
                        <p style={{ color: '#6b7280', marginBottom: 20 }}>
                            La page n'a pas pu s'afficher correctement. Rechargez la page ou revenez à l'accueil.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReload}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Recharger la page
                            </button>
                            <a
                                href="/"
                                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 20px', textDecoration: 'none', color: '#111827', fontWeight: 600 }}
                            >
                                Accueil
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
