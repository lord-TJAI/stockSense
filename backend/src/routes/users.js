'use strict';

const express = require('express');
const router  = express.Router();

const ctrl = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { verifyJWT }   = require('../middlewares/auth');
const { tenantScope } = require('../middlewares/tenantScope');
const { requireRole } = require('../middlewares/rbac');
const { changeRoleSchema } = require('../validators/authValidators');
const { z } = require('zod');

const makeValidator = (schema) => validate(schema);

const updateMeSchema = z.object({ name: z.string().min(1).max(100) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
});
const updateOrgSchema = z.object({ name: z.string().min(1).max(100) });

// All routes require auth
router.use(verifyJWT, tenantScope);

// ── Self ──────────────────────────────────────────────────────────────────────
router.get('/me',                ctrl.getMe);
router.patch('/me',              makeValidator(updateMeSchema),   ctrl.updateMe);
router.patch('/me/password',     makeValidator(changePasswordSchema), ctrl.changeMyPassword);

// ── Org settings ──────────────────────────────────────────────────────────────
router.get('/org',               ctrl.getOrg);
router.patch('/org',             requireRole('inventory_manager'), makeValidator(updateOrgSchema), ctrl.updateOrg);

// ── Invites (manager) ─────────────────────────────────────────────────────────
router.get('/invites',           requireRole('inventory_manager'), ctrl.listInvites);
router.delete('/invites/:id',    requireRole('inventory_manager'), ctrl.revokeInvite);

// ── User management (manager) ─────────────────────────────────────────────────
router.get('/',                  requireRole('inventory_manager'), ctrl.listUsers);
router.patch('/:id/role',        requireRole('inventory_manager'), makeValidator(changeRoleSchema), ctrl.changeRole);
router.patch('/:id/deactivate',  requireRole('inventory_manager'), ctrl.deactivateUser);
router.patch('/:id/reactivate',  requireRole('inventory_manager'), ctrl.reactivateUser);

module.exports = router;
