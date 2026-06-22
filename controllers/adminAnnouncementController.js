const AdminAnnouncement = require('../models/AdminAnnouncement');
const AuditLogModel = require('../models/AuditLogModel');
const notificationService = require('../services/notificationService');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const pool = require('../config/db');

const adminAnnouncementController = {
    // ====================================
    // CREATE ANNOUNCEMENT
    // ====================================
    createAnnouncement: [
        body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters.'),
        body('category').trim().notEmpty().withMessage('Category is required.'),
        body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const { title, category, description } = req.body;
                const wardId = req.user.ward_id;
                const image = req.file ? `/uploads/announcements/${req.file.filename}` : null;

                const announcementId = await AdminAnnouncement.create({
                    title,
                    category,
                    description,
                    image,
                    ward_id: wardId,
                    created_by: req.user.admin_id
                });

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'ANNOUNCEMENT_CREATED',
                    type: 'announcement',
                    status: 'success',
                    description: `Announcement created: "${title}" (${category})`,
                    entity_type: 'announcement',
                    entity_id: announcementId,
                    new_values: { title, category, description },
                    performed_by: req.user.id,
                    ip_address: req.ip
                });

                res.status(201).json({
                    success: true,
                    message: 'Announcement created successfully.',
                    announcement_id: announcementId
                });
            } catch (error) {
                console.error('Create Announcement Error:', error);
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                res.status(500).json({ success: false, message: 'Server error creating announcement.' });
            }
        }
    ],

    // ====================================
    // GET ALL ANNOUNCEMENTS
    // ====================================
        getAnnouncements: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            console.log('DEBUG wardId:', wardId, 'type:', typeof wardId);
            
            const { page, limit, search, category, status, sort } = req.query;

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                category: category || null,
                status: status || null,
                sort: sort || 'latest'
            };

            console.log('DEBUG options:', options);

            const result = await AdminAnnouncement.getAll(wardId, options);

            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Announcements Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching announcements.' });
        }
    },
    
    // ====================================
    // GET ANNOUNCEMENT BY ID
    // ====================================
    getAnnouncementById: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const announcement = await AdminAnnouncement.getById(req.params.id, wardId);

            if (!announcement) {
                return res.status(404).json({ success: false, message: 'Announcement not found.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'ANNOUNCEMENT_VIEWED',
                type: 'announcement',
                status: 'success',
                description: `Announcement viewed: "${announcement.title}"`,
                entity_type: 'announcement',
                entity_id: announcement.id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, announcement });
        } catch (error) {
            console.error('Get Announcement Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE ANNOUNCEMENT
    // ====================================
    updateAnnouncement: [
        body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters.'),
        body('category').trim().notEmpty().withMessage('Category is required.'),
        body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const { id } = req.params;
                const wardId = req.user.ward_id;
                const { title, category, description } = req.body;

                const existing = await AdminAnnouncement.getById(id, wardId);
                if (!existing) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(404).json({ success: false, message: 'Announcement not found.' });
                }

                const image = req.file ? `/uploads/announcements/${req.file.filename}` : null;

                // Delete old image if new one uploaded
                if (image && existing.image) {
                    const oldPath = require('path').join(__dirname, '..', existing.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }

                const updated = await AdminAnnouncement.update(id, wardId, {
                    title,
                    category,
                    description,
                    image
                });

                if (!updated) {
                    return res.status(500).json({ success: false, message: 'Failed to update announcement.' });
                }

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'ANNOUNCEMENT_UPDATED',
                    type: 'announcement',
                    status: 'success',
                    description: `Announcement updated: "${title}"`,
                    entity_type: 'announcement',
                    entity_id: id,
                    old_values: existing,
                    new_values: { title, category, description },
                    performed_by: req.user.id,
                    ip_address: req.ip
                });

                res.json({ success: true, message: 'Announcement updated successfully.' });
            } catch (error) {
                console.error('Update Announcement Error:', error);
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                res.status(500).json({ success: false, message: 'Server error updating announcement.' });
            }
        }
    ],

    // ====================================
    // DELETE ANNOUNCEMENT
    // ====================================
    deleteAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            const wardId = req.user.ward_id;

            const existing = await AdminAnnouncement.getById(id, wardId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Announcement not found.' });
            }

            const deleted = await AdminAnnouncement.softDelete(id, wardId);
            if (!deleted) {
                return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'ANNOUNCEMENT_DELETED',
                type: 'announcement',
                status: 'success',
                description: `Announcement deleted: "${existing.title}"`,
                entity_type: 'announcement',
                entity_id: id,
                old_values: existing,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Announcement deleted successfully.' });
        } catch (error) {
            console.error('Delete Announcement Error:', error);
            res.status(500).json({ success: false, message: 'Server error deleting announcement.' });
        }
    },

    // ====================================
    // PUBLISH ANNOUNCEMENT
    // ====================================
    publishAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            const wardId = req.user.ward_id;

            const existing = await AdminAnnouncement.getById(id, wardId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Announcement not found.' });
            }

            if (existing.status === 'published') {
                return res.status(400).json({ success: false, message: 'Announcement is already published.' });
            }

            const published = await AdminAnnouncement.publish(id, wardId);
            if (!published) {
                return res.status(500).json({ success: false, message: 'Failed to publish announcement.' });
            }

            // Notify all citizens in the ward
            try {
                const [citizens] = await pool.execute(
                    "SELECT id, full_name FROM citizens WHERE ward_id = ? AND is_deleted = FALSE AND status = 'active'",
                    [wardId]
                );

                for (const citizen of citizens) {
                    await notificationService.notifySuperAdmin(
                        'New Announcement Published',
                        `"${existing.title}" - ${existing.category} announcement for your ward.`,
                        'announcement',
                        'info',
                        'announcements',
                        id,
                        'megaphone'
                    );
                }
            } catch (notifyError) {
                console.log('Notification delivery partial:', notifyError.message);
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'ANNOUNCEMENT_PUBLISHED',
                type: 'announcement',
                status: 'success',
                description: `Announcement published: "${existing.title}"`,
                entity_type: 'announcement',
                entity_id: id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Announcement published successfully.' });
        } catch (error) {
            console.error('Publish Error:', error);
            res.status(500).json({ success: false, message: 'Server error publishing announcement.' });
        }
    },

    // ====================================
    // UNPUBLISH ANNOUNCEMENT
    // ====================================
    unpublishAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            const wardId = req.user.ward_id;

            const existing = await AdminAnnouncement.getById(id, wardId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Announcement not found.' });
            }

            if (existing.status === 'unpublished') {
                return res.status(400).json({ success: false, message: 'Announcement is already unpublished.' });
            }

            const unpublished = await AdminAnnouncement.unpublish(id, wardId);
            if (!unpublished) {
                return res.status(500).json({ success: false, message: 'Failed to unpublish announcement.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'ANNOUNCEMENT_UNPUBLISHED',
                type: 'announcement',
                status: 'success',
                description: `Announcement unpublished: "${existing.title}"`,
                entity_type: 'announcement',
                entity_id: id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Announcement unpublished successfully.' });
        } catch (error) {
            console.error('Unpublish Error:', error);
            res.status(500).json({ success: false, message: 'Server error unpublishing announcement.' });
        }
    },

    // ====================================
    // GET STATISTICS
    // ====================================
    getStats: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const stats = await AdminAnnouncement.getStats(wardId);
            res.json({ success: true, statistics: stats });
        } catch (error) {
            console.error('Stats Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminAnnouncementController;