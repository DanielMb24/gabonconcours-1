const jwt = require('jsonwebtoken');
const env = require('../config/env');

// LEGACY — conservé pour compatibilité server.js uniquement.
// La source active est middleware/mongoAuth.js (JWT + cookie admin_session).
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('Auth: Aucun token fourni'); // Log ajouté
        return res.status(401).json({
            success: false,
            message: 'Token d\'accès requis'
        });
    }

    if (!env.jwtSecret) {
        return res.status(500).json({ success: false, message: 'Configuration serveur incomplète (JWT)' });
    }
    jwt.verify(token, env.jwtSecret, (err, decoded) => {
        if (err) {
            console.log('Auth: Token invalide', err.message); // Log ajouté
            return res.status(403).json({
                success: false,
                message: 'Token invalide'
            });
        }

        req.admin = {
            adminId: decoded.adminId || decoded.id,
            id: decoded.adminId || decoded.id,
            role: decoded.role || 'admin_etablissement',
            etablissement_id: decoded.etablissement_id || null,
            nom: decoded.nom,
            prenom: decoded.prenom,
            email: decoded.email,
            admin_role: decoded.admin_role || 'notes'  
        };

        console.log('Auth: Admin authentifié', req.admin.email);
        next();
    });
};

const authenticateAdmin = authenticateToken;

module.exports = {authenticateToken, authenticateAdmin};