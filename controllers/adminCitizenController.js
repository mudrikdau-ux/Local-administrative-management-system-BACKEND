const AdminCitizen = require('../models/AdminCitizen');
const AuditLogModel = require('../models/AuditLogModel');
const { body, query, validationResult } = require('express-validator');

const adminCitizenController = {
    // ====================================
    // CREATE CITIZEN
    // ====================================
    createCitizen: [
        body('full_name').trim().notEmpty().withMessage('Full name is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),
        body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required if provided.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const { full_name, email, phone, address, status, registration_date } = req.body;
                const wardId = req.user.ward_id;
                const adminId = req.user.admin_id;

                // Check duplicate email if provided
                if (email) {
                    const emailExists = await AdminCitizen.getByEmail(email);
                    if (emailExists) {
                        return res.status(400).json({ success: false, message: 'Email already registered.' });
                    }
                }

                // Check duplicate phone
                const phoneExists = await AdminCitizen.getByPhone(phone);
                if (phoneExists) {
                    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
                }

                const citizenId = await AdminCitizen.create({
                    full_name,
                    email: email || null,
                    phone,
                    address: address || null,
                    status: status || 'active',
                    ward_id: wardId,
                    created_by: adminId,
                    registration_date: registration_date || new Date().toISOString().split('T')[0]
                });

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'CITIZEN_CREATED',
                    type: 'citizen',
                    status: 'success',
                    description: `Citizen registered: ${full_name}`,
                    entity_type: 'citizen',
                    entity_id: citizenId,
                    new_values: { full_name, email, phone, address, status },
                    performed_by: req.user.id,
                    ip_address: req.ip
                });

                res.status(201).json({
                    success: true,
                    message: 'Citizen registered successfully.',
                    citizen_id: citizenId
                });
            } catch (error) {
                console.error('Create Citizen Error:', error);
                res.status(500).json({ success: false, message: 'Server error creating citizen.' });
            }
        }
    ],

    // ====================================
    // GET ALL CITIZENS (Paginated + Filtered + Searched)
    // ====================================
    getCitizens: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const { page, limit, status, name } = req.query;

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                status: status || null,
                name: name || null
            };

            const result = await AdminCitizen.getAll(wardId, options);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Get Citizens Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching citizens.' });
        }
    },

    // ====================================
    // GET CITIZEN BY ID
    // ====================================
    getCitizenById: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const citizen = await AdminCitizen.getById(req.params.id, wardId);

            if (!citizen) {
                return res.status(404).json({ success: false, message: 'Citizen not found.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'CITIZEN_VIEWED',
                type: 'citizen',
                status: 'success',
                description: `Citizen viewed: ${citizen.full_name}`,
                entity_type: 'citizen',
                entity_id: citizen.id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, citizen });
        } catch (error) {
            console.error('Get Citizen Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE CITIZEN
    // ====================================
    updateCitizen: [
        body('full_name').trim().notEmpty().withMessage('Full name is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),
        body('status').optional().isIn(['active', 'inactive', 'deceased']).withMessage('Invalid status.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const { id } = req.params;
                const wardId = req.user.ward_id;
                const { full_name, email, phone, address, status } = req.body;

                // Check if citizen exists in admin's ward
                const existing = await AdminCitizen.getById(id, wardId);
                if (!existing) {
                    return res.status(404).json({ success: false, message: 'Citizen not found.' });
                }

                // Check duplicate email
                if (email && email !== existing.email) {
                    const emailExists = await AdminCitizen.getByEmail(email, id);
                    if (emailExists) {
                        return res.status(400).json({ success: false, message: 'Email already in use.' });
                    }
                }

                // Check duplicate phone
                if (phone !== existing.phone) {
                    const phoneExists = await AdminCitizen.getByPhone(phone, id);
                    if (phoneExists) {
                        return res.status(400).json({ success: false, message: 'Phone number already in use.' });
                    }
                }

                const updated = await AdminCitizen.update(id, wardId, {
                    full_name,
                    email: email || null,
                    phone,
                    address: address || null,
                    status: status || existing.status,
                    updated_by: req.user.id
                });

                if (!updated) {
                    return res.status(500).json({ success: false, message: 'Failed to update citizen.' });
                }

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'CITIZEN_UPDATED',
                    type: 'citizen',
                    status: 'success',
                    description: `Citizen updated: ${full_name}`,
                    entity_type: 'citizen',
                    entity_id: id,
                    old_values: existing,
                    new_values: { full_name, email, phone, address, status },
                    performed_by: req.user.id,
                    ip_address: req.ip
                });

                res.json({ success: true, message: 'Citizen updated successfully.' });
            } catch (error) {
                console.error('Update Citizen Error:', error);
                res.status(500).json({ success: false, message: 'Server error updating citizen.' });
            }
        }
    ],

    // ====================================
    // DELETE CITIZEN (Soft Delete)
    // ====================================
    deleteCitizen: async (req, res) => {
        try {
            const { id } = req.params;
            const wardId = req.user.ward_id;

            const existing = await AdminCitizen.getById(id, wardId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Citizen not found.' });
            }

            const deleted = await AdminCitizen.softDelete(id, wardId);
            if (!deleted) {
                return res.status(500).json({ success: false, message: 'Failed to delete citizen.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'CITIZEN_DELETED',
                type: 'citizen',
                status: 'success',
                description: `Citizen deleted: ${existing.full_name}`,
                entity_type: 'citizen',
                entity_id: id,
                old_values: existing,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Citizen deleted successfully.' });
        } catch (error) {
            console.error('Delete Citizen Error:', error);
            res.status(500).json({ success: false, message: 'Server error deleting citizen.' });
        }
    },

    // ====================================
    // GET WARD STATISTICS
    // ====================================
    getWardStats: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const stats = await AdminCitizen.getWardStats(wardId);
            res.json({ success: true, ward_id: wardId, ward_name: req.user.ward_name, statistics: stats });
        } catch (error) {
            console.error('Ward Stats Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminCitizenController;