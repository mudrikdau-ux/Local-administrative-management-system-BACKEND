const AdminCitizen = require('../models/AdminCitizen');
const AuditLogModel = require('../models/AuditLogModel');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generateOTP } = require('../utils/helpers');
const { sendWelcomeEmail, sendPasswordResetNotification } = require('../services/emailService');
const { withTransaction } = require('../utils/transactionHelper');
const pool = require('../config/db');

const adminCitizenController = {
    // ====================================
    // CREATE CITIZEN (With Transaction & Welcome Email)
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
                const wardName = req.user.ward_name || 'Your';
                const adminId = req.user.admin_id;

                // Check duplicate email if provided
                if (email) {
                    const emailExists = await AdminCitizen.getByEmail(email);
                    if (emailExists) {
                        return res.status(400).json({ success: false, message: 'Email already registered.' });
                    }

                    const [userExists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
                    if (userExists.length > 0) {
                        return res.status(400).json({ success: false, message: 'Email already registered in the system.' });
                    }
                }

                // Check duplicate phone
                const phoneExists = await AdminCitizen.getByPhone(phone);
                if (phoneExists) {
                    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
                }

                // Use transaction for atomic operation
                const result = await withTransaction(async (connection) => {
                    let userId = null;
                    let tempPassword = null;

                    // Create user account if email provided
                    if (email) {
                        tempPassword = generateOTP() + 'Ctz';
                        const salt = await bcrypt.genSalt(12);
                        const hashedPassword = await bcrypt.hash(tempPassword, salt);

                        const [userResult] = await connection.execute(
                            'INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [full_name, email, phone, hashedPassword, 'citizen', 'active']
                        );
                        userId = userResult.insertId;

                        await connection.execute(
                            'UPDATE users SET temp_password = ?, password_changed = FALSE WHERE id = ?',
                            [tempPassword, userId]
                        );
                    }

                    // Create citizen record
                    const [citizenResult] = await connection.execute(
                        `INSERT INTO citizens (full_name, email, phone, address, status, ward_id, created_by, registration_date, user_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [full_name, email || null, phone, address || null, status || 'active', wardId, adminId,
                         registration_date || new Date().toISOString().split('T')[0], userId]
                    );

                    return { userId, citizenId: citizenResult.insertId, tempPassword };
                });

                // Send welcome email (outside transaction)
                let emailSent = false;
                if (email && result.tempPassword) {
                    try {
                        await sendWelcomeEmail(email, full_name, result.tempPassword, wardName);
                        emailSent = true;
                    } catch (emailError) {
                        console.log('Welcome email not sent:', emailError.message);
                        console.log(`========================================`);
                        console.log(`Citizen Temp Password for ${email}: ${result.tempPassword}`);
                        console.log(`========================================`);
                    }
                }

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'CITIZEN_CREATED',
                    type: 'citizen',
                    status: 'success',
                    description: `Citizen registered: ${full_name}${email ? ' (Account created with welcome email)' : ''}`,
                    entity_type: 'citizen',
                    entity_id: result.citizenId,
                    new_values: { full_name, email, phone, address, status, account_created: !!result.userId },
                    performed_by: req.user.id,
                    ip_address: req.ip
                });

                res.status(201).json({
                    success: true,
                    message: 'Citizen registered successfully.',
                    citizen_id: result.citizenId,
                    user_id: result.userId,
                    account_created: !!result.userId,
                    welcome_email_sent: emailSent,
                    temporary_password: email ? result.tempPassword : null
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

                const existing = await AdminCitizen.getById(id, wardId);
                if (!existing) {
                    return res.status(404).json({ success: false, message: 'Citizen not found.' });
                }

                if (email && email !== existing.email) {
                    const emailExists = await AdminCitizen.getByEmail(email, id);
                    if (emailExists) {
                        return res.status(400).json({ success: false, message: 'Email already in use.' });
                    }
                    const [userExists] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, existing.user_id || 0]);
                    if (userExists.length > 0) {
                        return res.status(400).json({ success: false, message: 'Email already registered in the system.' });
                    }
                }

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

                if (email && email !== existing.email && existing.user_id) {
                    await pool.execute('UPDATE users SET email = ?, full_name = ?, phone = ? WHERE id = ?', 
                        [email, full_name, phone, existing.user_id]);
                }

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
    // RESET CITIZEN PASSWORD
    // ====================================
    resetCitizenPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const wardId = req.user.ward_id;

            const citizen = await AdminCitizen.getById(id, wardId);
            if (!citizen) {
                return res.status(404).json({ success: false, message: 'Citizen not found.' });
            }

            if (!citizen.email) {
                return res.status(400).json({ success: false, message: 'This citizen does not have an email address.' });
            }

            const [userRows] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND role = ?',
                [citizen.email, 'citizen']
            );

            let userId;
            let tempPassword = generateOTP() + 'Ctz';
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            if (userRows.length > 0) {
                userId = userRows[0].id;
                await pool.execute(
                    'UPDATE users SET password = ?, temp_password = ?, password_changed = FALSE WHERE id = ?',
                    [hashedPassword, tempPassword, userId]
                );
            } else {
                const User = require('../models/User');
                userId = await User.create({
                    full_name: citizen.full_name,
                    email: citizen.email,
                    phone: citizen.phone,
                    password: hashedPassword,
                    role: 'citizen'
                });
                await pool.execute('UPDATE citizens SET user_id = ? WHERE id = ?', [userId, citizen.id]);
            }

            let emailSent = false;
            try {
                await sendPasswordResetNotification(citizen.email, citizen.full_name, tempPassword);
                emailSent = true;
            } catch (emailError) {
                console.log('Password reset email not sent:', emailError.message);
                console.log(`========================================`);
                console.log(`Reset Password for ${citizen.email}: ${tempPassword}`);
                console.log(`========================================`);
            }

            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'CITIZEN_PASSWORD_RESET',
                type: 'citizen',
                status: 'success',
                description: `Password reset for citizen: ${citizen.full_name}`,
                entity_type: 'citizen',
                entity_id: id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Citizen password reset successfully.',
                temporary_password: tempPassword,
                citizen_email: citizen.email,
                email_sent: emailSent
            });
        } catch (error) {
            console.error('Reset Citizen Password Error:', error);
            res.status(500).json({ success: false, message: 'Server error resetting password.' });
        }
    },

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