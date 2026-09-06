const { getConnection } = require('../config/database');

class Notification {
    static async create(notificationData) {
        const connection = getConnection();

        try {
            let candidatNupcan = notificationData.candidat_nupcan;
            if (!candidatNupcan && notificationData.candidat_id) {
                const [candidats] = await connection.execute(
                    'SELECT nupcan FROM candidats WHERE id = ?',
                    [notificationData.candidat_id]
                );
                candidatNupcan = candidats[0]?.nupcan;
            }
            if (!candidatNupcan) throw new Error('NUPCAN candidat requis pour créer une notification');

            const [result] = await connection.execute(
                `INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    candidatNupcan,
                    notificationData.type || 'info',
                    notificationData.titre,
                    notificationData.message,
                    notificationData.statut || 'non_lu'
                ]
            );

            return {
                id: result.insertId,
                ...notificationData,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur création notification:', error);
            throw error;
        }
    }

    static async findByCandidat(candidatId) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT * FROM notifications WHERE candidat_nupcan = ? ORDER BY created_at DESC`,
                [candidatId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            return [];
        }
    }

    static async markAsRead(id) {
        const connection = getConnection();

        try {
            await connection.execute(
                'UPDATE notifications SET statut = ? WHERE id = ?',
                ['lu', id]
            );
            return { success: true };
        } catch (error) {
            console.error('Erreur marquage notification:', error);
            throw error;
        }
    }

    static async delete(id) {
        const connection = getConnection();

        try {
            await connection.execute('DELETE FROM notifications WHERE id = ?', [id]);
            return { success: true };
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            throw error;
        }
    }

    static async deleteAllByCandidat(candidatId) {
        const connection = getConnection();

        try {
            await connection.execute('DELETE FROM notifications WHERE candidat_nupcan = ?', [candidatId]);
            return { success: true };
        } catch (error) {
            console.error('Erreur suppression notifications:', error);
            throw error;
        }
    }
}

module.exports = Notification;
