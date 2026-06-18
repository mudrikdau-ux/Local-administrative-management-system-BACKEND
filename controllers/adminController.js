const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Ward = require('../models/Ward');
const Position = require('../models/Position');
const Leadership = require('../models/Leadership');
const AuditLog = require('../models/AuditLog');
const { generateOTP } = require('../utils/helpers');

const adminController = {
    // ====================================
    // WARDS
    // ====================================
    getWards: async (req, res) => {
        try {
            const wards = await Ward.getAll();
            res.json({ wards });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    addWard: async (req, res) => {
        try {
            const { ward_name } = req.body;
            if (!ward_name) return res.status(400).json({ message: 'Ward name required.' });
            const id = await Ward.create(ward_name);
            res.status(201).json({ message: 'Ward added.', ward_id: id });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    deleteWard: async (req, res) => {
        try {
            await Ward.delete(req.params.id);
            res.json({ message: 'Ward deleted.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // POSITIONS
    // ====================================
    getPositions: async (req, res) => {
        try {
            const positions = await Position.getAll();
            res.json({ positions });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    addPosition: async (req, res) => {
        try {
            const { position_name } = req.body;
            if (!position_name) return res.status(400).json({ message: 'Position name required.' });
            const id = await Position.create(position_name);
            res.status(201).json({ message: 'Position added.', position_id: id });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    deletePosition: async (req, res) => {
        try {
            await Position.delete(req.params.id);
            res.json({ message: 'Position deleted.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // ADMIN CRUD
    // ====================================
    getAllAdmins: async (req, res) => {
        try {
            const admins = await Admin.getAll();
            res.json({ admins, total: admins.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    getAdminById: async (req, res) => {
        try {
            const admin = await Admin.getById(req.params.id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            const leadershipHistory = await Admin.getLeadershipHistory(req.params.id);
            const transfers = await Leadership.getTransfersByAdmin(req.params.id);

            res.json({ admin, leadership_history: leadershipHistory, transfers });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    createAdmin: async (req, res) => {
        try {
            const { full_name, email, phone, ward_id, position_id, start_date, end_date, status, performed_by } = req.body;

            if (!full_name || !email || !phone || !ward_id || !position_id || !start_date || !end_date) {
                return res.status(400).json({ message: 'All fields are required.' });
            }

            const existingEmail = await Admin.getByEmail(email);
            if (existingEmail) return res.status(400).json({ message: 'Email already exists.' });

            const existingPhone = await Admin.getByPhone(phone);
            if (existingPhone) return res.status(400).json({ message: 'Phone number already exists.' });

            const tempPassword = generateOTP() + 'Abc';
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            const userId = await User.create({
                full_name,
                email,
                phone,
                password: hashedPassword,
                role: 'admin'
            });

            const profile_photo = req.file ? '/uploads/profiles/' + req.file.filename : null;

            const adminId = await Admin.create({
                user_id: userId,
                profile_photo,
                full_name,
                email,
                phone,
                ward_id,
                position_id,
                start_date,
                end_date,
                status: status || 'active',
                created_by: performed_by
            });

            await Leadership.createAssignment({
                admin_id: adminId,
                ward_id,
                position_id,
                assigned_by: performed_by,
                assigned_date: new Date().toISOString().split('T')[0],
                start_date,
                end_date
            });

            await Leadership.addHistory({
                admin_id: adminId,
                ward_id,
                position_id,
                action: 'appointed',
                start_date,
                end_date,
                reason: 'Initial appointment',
                performed_by
            });

            await AuditLog.create({
                admin_id: adminId,
                action: 'ADMIN_CREATED',
                entity_type: 'admin',
                entity_id: adminId,
                description: `Admin ${full_name} created with temporary password`,
                performed_by,
                ip_address: req.ip
            });

            res.status(201).json({
                message: 'Admin created successfully.',
                admin_id: adminId,
                user_id: userId,
                temporary_password: tempPassword
            });
        } catch (error) {
            console.error('Create Admin Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    updateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { full_name, email, phone, ward_id, position_id, start_date, end_date, status, performed_by } = req.body;

            const existingAdmin = await Admin.getById(id);
            if (!existingAdmin) return res.status(404).json({ message: 'Admin not found.' });

            const oldValues = { ...existingAdmin };
            const profile_photo = req.file ? '/uploads/profiles/' + req.file.filename : null;

            await Admin.update(id, {
                full_name: full_name || existingAdmin.full_name,
                email: email || existingAdmin.email,
                phone: phone || existingAdmin.phone,
                ward_id: ward_id || existingAdmin.ward_id,
                position_id: position_id || existingAdmin.position_id,
                start_date: start_date || existingAdmin.start_date,
                end_date: end_date || existingAdmin.end_date,
                status: status || existingAdmin.status,
                profile_photo
            });

            if (email && email !== existingAdmin.email && existingAdmin.user_id) {
                await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, existingAdmin.user_id]);
            }

            await AuditLog.create({
                admin_id: id,
                action: 'ADMIN_UPDATED',
                entity_type: 'admin',
                entity_id: id,
                description: `Admin ${existingAdmin.full_name} updated`,
                old_values: oldValues,
                new_values: { full_name, email, phone, ward_id, position_id, start_date, end_date, status },
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Admin updated successfully.' });
        } catch (error) {
            console.error('Update Admin Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    suspendAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            await Admin.updateStatus(id, 'suspended');

            if (admin.user_id) {
                await User.updateStatus(admin.user_id, 'suspended');
            }

            await AuditLog.create({
                admin_id: id,
                action: 'ADMIN_SUSPENDED',
                entity_type: 'admin',
                entity_id: id,
                description: `Admin ${admin.full_name} has been suspended`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Admin suspended successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    activateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            await Admin.updateStatus(id, 'active');

            if (admin.user_id) {
                await User.updateStatus(admin.user_id, 'active');
            }

            await AuditLog.create({
                admin_id: id,
                action: 'ADMIN_ACTIVATED',
                entity_type: 'admin',
                entity_id: id,
                description: `Admin ${admin.full_name} has been activated`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Admin activated successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });
            if (!admin.user_id) return res.status(400).json({ message: 'No user account linked.' });

            const tempPassword = generateOTP() + 'Xyz';
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            await User.updatePassword(admin.user_id, hashedPassword);

            await AuditLog.create({
                admin_id: id,
                action: 'PASSWORD_RESET',
                entity_type: 'admin',
                entity_id: id,
                description: `Password reset for ${admin.full_name}`,
                performed_by,
                ip_address: req.ip
            });

            res.json({
                message: 'Password reset successfully.',
                temporary_password: tempPassword,
                email: admin.email
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            await Leadership.endAssignment(id);

            await Leadership.addHistory({
                admin_id: id,
                ward_id: admin.ward_id,
                position_id: admin.position_id,
                action: 'deleted',
                reason: 'Admin account deleted',
                performed_by
            });

            if (admin.user_id) {
                await User.deleteUser(admin.user_id);
            }

            await Admin.delete(id);

            await AuditLog.create({
                admin_id: id,
                action: 'ADMIN_DELETED',
                entity_type: 'admin',
                entity_id: id,
                description: `Admin ${admin.full_name} permanently deleted`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Admin deleted permanently.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // SEARCH & FILTER
    // ====================================
    searchAdmins: async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ message: 'Search query required.' });

            const admins = await Admin.search(q);
            res.json({ admins, total: admins.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    filterAdmins: async (req, res) => {
        try {
            const { status, ward_id } = req.query;
            const filters = {};
            if (status) filters.status = status;
            if (ward_id) filters.ward_id = ward_id;

            const admins = await Admin.filter(filters);
            res.json({ admins, total: admins.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // LEADERSHIP
    // ====================================
    transferLeader: async (req, res) => {
        try {
            const { admin_id, new_ward_id, new_position_id, previous_leader_id, transfer_date, reason, performed_by } = req.body;

            const admin = await Admin.getById(admin_id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            const activeAssignment = await Leadership.getActiveAssignment(admin_id);

            if (activeAssignment) {
                await Leadership.endAssignment(admin_id);
            }

            await Leadership.createTransfer({
                admin_id,
                previous_ward_id: activeAssignment ? activeAssignment.ward_id : null,
                new_ward_id,
                previous_position_id: activeAssignment ? activeAssignment.position_id : null,
                new_position_id,
                previous_leader_id: previous_leader_id || null,
                transfer_date,
                reason,
                transferred_by: performed_by
            });

            await Leadership.createAssignment({
                admin_id,
                ward_id: new_ward_id,
                position_id: new_position_id,
                assigned_by: performed_by,
                assigned_date: transfer_date,
                start_date: transfer_date,
                end_date: admin.end_date
            });

            await Admin.update(admin_id, {
                full_name: admin.full_name,
                email: admin.email,
                phone: admin.phone,
                ward_id: new_ward_id,
                position_id: new_position_id,
                start_date: admin.start_date,
                end_date: admin.end_date,
                status: admin.status
            });

            await Leadership.addHistory({
                admin_id,
                ward_id: new_ward_id,
                position_id: new_position_id,
                action: 'transferred',
                start_date: transfer_date,
                end_date: admin.end_date,
                reason,
                performed_by
            });

            await AuditLog.create({
                admin_id,
                action: 'LEADER_TRANSFERRED',
                entity_type: 'leadership',
                entity_id: admin_id,
                description: `${admin.full_name} transferred to new ward`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Leader transferred successfully.' });
        } catch (error) {
            console.error('Transfer Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    getTransferHistory: async (req, res) => {
        try {
            const transfers = await Leadership.getTransfersByAdmin(req.params.id);
            res.json({ transfers });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    getAllTransfers: async (req, res) => {
        try {
            const transfers = await Leadership.getAllTransfers();
            res.json({ transfers, total: transfers.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    extendTerm: async (req, res) => {
        try {
            const { id } = req.params;
            const { new_end_date, reason, performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            await Admin.update(id, {
                full_name: admin.full_name,
                email: admin.email,
                phone: admin.phone,
                ward_id: admin.ward_id,
                position_id: admin.position_id,
                start_date: admin.start_date,
                end_date: new_end_date,
                status: admin.status
            });

            await Leadership.extendTerm(id, new_end_date);

            await Leadership.addHistory({
                admin_id: id,
                ward_id: admin.ward_id,
                position_id: admin.position_id,
                action: 'term_extended',
                start_date: admin.start_date,
                end_date: new_end_date,
                reason,
                performed_by
            });

            await AuditLog.create({
                admin_id: id,
                action: 'TERM_EXTENDED',
                entity_type: 'admin',
                entity_id: id,
                description: `Term extended for ${admin.full_name} to ${new_end_date}`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Term extended successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    endTerm: async (req, res) => {
        try {
            const { id } = req.params;
            const { end_date, reason, performed_by } = req.body;

            const admin = await Admin.getById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found.' });

            await Admin.updateStatus(id, 'inactive');

            await Leadership.endAssignment(id);

            if (admin.user_id) {
                await User.updateStatus(admin.user_id, 'inactive');
            }

            await Leadership.addHistory({
                admin_id: id,
                ward_id: admin.ward_id,
                position_id: admin.position_id,
                action: 'term_ended',
                start_date: admin.start_date,
                end_date: end_date || new Date().toISOString().split('T')[0],
                reason,
                performed_by
            });

            await AuditLog.create({
                admin_id: id,
                action: 'TERM_ENDED',
                entity_type: 'admin',
                entity_id: id,
                description: `Term ended for ${admin.full_name}: ${reason}`,
                performed_by,
                ip_address: req.ip
            });

            res.json({ message: 'Term ended successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // AUDIT LOGS
    // ====================================
    getAuditLogs: async (req, res) => {
        try {
            const logs = await AuditLog.getAll();
            res.json({ logs, total: logs.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    }
};

module.exports = adminController;