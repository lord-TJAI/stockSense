'use strict';

const inventoryService = require('../services/inventoryService');
const stockLevelRepo = require('../repositories/stockLevelRepository');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { getPagination, paginationMeta } = require('../utils/pagination');

// ── Warehouses ────────────────────────────────────────────────────────────────

async function listWarehouses(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { warehouses, total } = await req.repos.warehouses.list({ skip, limit, search: req.query.search });
  res.json(new ApiResponse(200, 'Warehouses retrieved', {
    warehouses,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getWarehouse(req, res) {
  const warehouse = await req.repos.warehouses.findById(req.params.id);
  if (!warehouse) throw new ApiError(404, 'NOT_FOUND', 'Warehouse not found');
  res.json(new ApiResponse(200, 'Warehouse retrieved', warehouse));
}

async function createWarehouse(req, res) {
  const warehouse = await inventoryService.createWarehouse(req.body, req.repos);
  res.status(201).json(new ApiResponse(201, 'Warehouse created', warehouse));
}

async function updateWarehouse(req, res) {
  const warehouse = await inventoryService.updateWarehouse(req.params.id, req.body, req.repos);
  res.json(new ApiResponse(200, 'Warehouse updated', warehouse));
}

async function deactivateWarehouse(req, res) {
  await inventoryService.deactivateWarehouse(req.params.id, req.repos);
  res.json(new ApiResponse(200, 'Warehouse deactivated'));
}

// ── Locations ─────────────────────────────────────────────────────────────────

async function listLocations(req, res) {
  const { warehouseId } = req.params;
  const { page, limit, skip } = getPagination(req.query);
  const { locations, total } = await req.repos.locations.listForWarehouse(warehouseId, { skip, limit });
  res.json(new ApiResponse(200, 'Locations retrieved', {
    locations,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function createLocation(req, res) {
  const location = await inventoryService.createLocation(req.params.warehouseId, req.body, req.repos);
  res.status(201).json(new ApiResponse(201, 'Location created', location));
}

async function updateLocation(req, res) {
  const location = await inventoryService.updateLocation(req.params.id, req.body, req.repos);
  res.json(new ApiResponse(200, 'Location updated', location));
}

async function deactivateLocation(req, res) {
  await inventoryService.deactivateLocation(req.params.id, req.repos);
  res.json(new ApiResponse(200, 'Location deactivated'));
}

// ── Categories ────────────────────────────────────────────────────────────────

async function listCategories(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { categories, total } = await req.repos.categories.list({ skip, limit, search: req.query.search });
  res.json(new ApiResponse(200, 'Categories retrieved', {
    categories,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function createCategory(req, res) {
  const category = await inventoryService.createCategory(req.body, req.repos);
  res.status(201).json(new ApiResponse(201, 'Category created', category));
}

async function updateCategory(req, res) {
  const category = await inventoryService.updateCategory(req.params.id, req.body, req.repos);
  res.json(new ApiResponse(200, 'Category updated', category));
}

async function deactivateCategory(req, res) {
  await inventoryService.deactivateCategory(req.params.id, req.repos);
  res.json(new ApiResponse(200, 'Category deactivated'));
}

// ── Products ──────────────────────────────────────────────────────────────────

async function listProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { products, total } = await req.repos.products.list({
    skip, limit,
    search: req.query.search,
    categoryId: req.query.categoryId,
  });

  // Attach per-location stock to each product
  const productsWithStock = await Promise.all(
    products.map(async (p) => {
      const stockLevels = await stockLevelRepo.findForProduct(req.repos.products.organizationId, p._id);
      return { ...p.toObject(), stockLevels };
    })
  );

  res.json(new ApiResponse(200, 'Products retrieved', {
    products: productsWithStock,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getProduct(req, res) {
  const product = await req.repos.products.findById(req.params.id);
  if (!product || product.isDeleted) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
  const stockLevels = await stockLevelRepo.findForProduct(req.repos.products.organizationId, product._id);
  const totalStock = await stockLevelRepo.totalForProduct(req.repos.products.organizationId, product._id);
  res.json(new ApiResponse(200, 'Product retrieved', { ...product.toObject(), stockLevels, totalStock }));
}

async function createProduct(req, res) {
  // Numeric fields come as strings when using multipart/form-data
  const data = {
    ...req.body,
    reorderPoint: Number(req.body.reorderPoint) || 0,
    reorderQty: Number(req.body.reorderQty) || 0,
  };
  const product = await inventoryService.createProduct(data, req.file, req.repos);
  res.status(201).json(new ApiResponse(201, 'Product created', product));
}

async function updateProduct(req, res) {
  const data = { ...req.body };
  if (data.reorderPoint !== undefined) data.reorderPoint = Number(data.reorderPoint);
  if (data.reorderQty !== undefined) data.reorderQty = Number(data.reorderQty);
  const product = await inventoryService.updateProduct(req.params.id, data, req.file, req.repos);
  res.json(new ApiResponse(200, 'Product updated', product));
}

async function deleteProduct(req, res) {
  await inventoryService.deleteProduct(req.params.id, req.repos);
  res.json(new ApiResponse(200, 'Product deleted'));
}

module.exports = {
  listWarehouses, getWarehouse, createWarehouse, updateWarehouse, deactivateWarehouse,
  listLocations, createLocation, updateLocation, deactivateLocation,
  listCategories, createCategory, updateCategory, deactivateCategory,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
};
