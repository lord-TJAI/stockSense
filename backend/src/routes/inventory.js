'use strict';

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/inventoryController');
const { verifyJWT } = require('../middlewares/auth');
const { tenantScope } = require('../middlewares/tenantScope');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const {
  createWarehouseSchema, updateWarehouseSchema,
  createLocationSchema, updateLocationSchema,
  createCategorySchema, updateCategorySchema,
  createProductSchema, updateProductSchema,
} = require('../validators/inventoryValidators');

const mgr = requireRole('inventory_manager');
const auth = [verifyJWT, tenantScope];
const authMgr = [...auth, mgr];

// ── Warehouses ────────────────────────────────────────────────────────────────
router.get('/warehouses',                   ...auth,    ctrl.listWarehouses);
router.get('/warehouses/:id',               ...auth,    ctrl.getWarehouse);
router.post('/warehouses',                  ...authMgr, validate(createWarehouseSchema), ctrl.createWarehouse);
router.patch('/warehouses/:id',             ...authMgr, validate(updateWarehouseSchema), ctrl.updateWarehouse);
router.delete('/warehouses/:id',            ...authMgr, ctrl.deactivateWarehouse);

// ── Locations (nested under warehouse) ───────────────────────────────────────
router.get('/warehouses/:warehouseId/locations',         ...auth,    ctrl.listLocations);
router.post('/warehouses/:warehouseId/locations',        ...authMgr, validate(createLocationSchema), ctrl.createLocation);
router.patch('/locations/:id',                           ...authMgr, validate(updateLocationSchema), ctrl.updateLocation);
router.delete('/locations/:id',                          ...authMgr, ctrl.deactivateLocation);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories',                   ...auth,    ctrl.listCategories);
router.post('/categories',                  ...authMgr, validate(createCategorySchema), ctrl.createCategory);
router.patch('/categories/:id',             ...authMgr, validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/categories/:id',            ...authMgr, ctrl.deactivateCategory);

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products',                     ...auth,    ctrl.listProducts);
router.get('/products/:id',                 ...auth,    ctrl.getProduct);
router.post('/products',                    ...authMgr, upload.single('image'), ctrl.createProduct);
router.patch('/products/:id',               ...authMgr, upload.single('image'), ctrl.updateProduct);
router.delete('/products/:id',              ...authMgr, ctrl.deleteProduct);

module.exports = router;
