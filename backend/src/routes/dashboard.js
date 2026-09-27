'use strict';

const express = require('express');
const router  = express.Router();

const ctrl = require('../controllers/dashboardController');
const { verifyJWT }    = require('../middlewares/auth');
const { tenantScope }  = require('../middlewares/tenantScope');

const auth = [verifyJWT, tenantScope];

// Dashboard KPI summary — polled every 30 s on the frontend
router.get('/dashboard',              ...auth, ctrl.getKpiSummary);

// Alert feeds
router.get('/alerts/low-stock',       ...auth, ctrl.getLowStockAlerts);
router.get('/alerts/out-of-stock',    ...auth, ctrl.getOutOfStockAlerts);

// Per-product stock snapshot (used by product detail page)
router.get('/stock/snapshot/:productId', ...auth, ctrl.getProductStockSnapshot);

module.exports = router;
