'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { verifyJWT } = require('../middlewares/auth');
const { tenantScope } = require('../middlewares/tenantScope');
const { requireRole } = require('../middlewares/rbac');
const { changeRoleSchema } = require('../validators/authValidators');

// All user routes require auth
router.use(verifyJWT, tenantScope);

router.get('/me',             userController.getMe);
router.get('/',               requireRole('inventory_manager'), userController.listUsers);
router.patch('/:id/role',     requireRole('inventory_manager'), validate(changeRoleSchema), userController.changeRole);
router.patch('/:id/deactivate', requireRole('inventory_manager'), userController.deactivateUser);

module.exports = router;
