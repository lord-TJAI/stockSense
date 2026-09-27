'use strict';

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/stockController');
const { verifyJWT } = require('../middlewares/auth');
const { tenantScope } = require('../middlewares/tenantScope');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  receiptSchema, deliverySchema, transferSchema, adjustmentSchema,
} = require('../validators/stockValidators');

const auth    = [verifyJWT, tenantScope];
const authMgr = [...auth, requireRole('inventory_manager')];

// ── Receipts (both roles can receive) ────────────────────────────────────────
router.post('/receipts',          ...auth,    validate(receiptSchema),   ctrl.createReceipt);
router.get('/receipts',           ...auth,                               ctrl.listReceipts);
router.get('/receipts/:id',       ...auth,                               ctrl.getReceipt);

// ── Deliveries (both roles) ───────────────────────────────────────────────────
router.post('/deliveries',        ...auth,    validate(deliverySchema),  ctrl.createDelivery);
router.get('/deliveries',         ...auth,                               ctrl.listDeliveries);
router.get('/deliveries/:id',     ...auth,                               ctrl.getDelivery);

// ── Transfers (both roles) ────────────────────────────────────────────────────
router.post('/transfers',         ...auth,    validate(transferSchema),  ctrl.createTransfer);
router.get('/transfers',          ...auth,                               ctrl.listTransfers);
router.get('/transfers/:id',      ...auth,                               ctrl.getTransfer);

// ── Adjustments (manager only) ────────────────────────────────────────────────
router.post('/adjustments',       ...authMgr, validate(adjustmentSchema), ctrl.createAdjustment);
router.get('/adjustments',        ...auth,                                ctrl.listAdjustments);
router.get('/adjustments/:id',    ...auth,                                ctrl.getAdjustment);

// ── Stock levels & history ────────────────────────────────────────────────────
router.get('/stock/levels',                 ...auth, ctrl.getStockLevels);
router.get('/stock/history/:productId',     ...auth, ctrl.getProductHistory);

module.exports = router;
