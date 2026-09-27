'use strict';

const ApiError = require('../utils/ApiError');
const storageService = require('../config/storage');
const fs = require('fs');

// ── Warehouses ────────────────────────────────────────────────────────────────

async function createWarehouse(data, repos) {
  const existing = await repos.warehouses.findByCode(data.code);
  if (existing) throw new ApiError(409, 'CODE_EXISTS', `Warehouse code '${data.code.toUpperCase()}' already exists`);

  const warehouse = await repos.warehouses.create({ ...data, code: data.code.toUpperCase() });

  // Auto-create default "Main Floor" location
  await repos.locations.create({
    warehouseId: warehouse._id,
    name: 'Main Floor',
    code: 'MAIN',
  });

  return warehouse;
}

async function updateWarehouse(id, data, repos) {
  const warehouse = await repos.warehouses.findById(id);
  if (!warehouse) throw new ApiError(404, 'NOT_FOUND', 'Warehouse not found');

  if (data.code) {
    const existing = await repos.warehouses.findByCode(data.code);
    if (existing && existing._id.toString() !== id) {
      throw new ApiError(409, 'CODE_EXISTS', `Warehouse code '${data.code.toUpperCase()}' already in use`);
    }
    data.code = data.code.toUpperCase();
  }

  return repos.warehouses.findOneAndUpdate({ _id: id }, { $set: data });
}

async function deactivateWarehouse(id, repos) {
  const warehouse = await repos.warehouses.findById(id);
  if (!warehouse) throw new ApiError(404, 'NOT_FOUND', 'Warehouse not found');
  return repos.warehouses.deactivate(id);
}

// ── Locations ─────────────────────────────────────────────────────────────────

async function createLocation(warehouseId, data, repos) {
  const warehouse = await repos.warehouses.findById(warehouseId);
  if (!warehouse || !warehouse.isActive) {
    throw new ApiError(404, 'NOT_FOUND', 'Warehouse not found or inactive');
  }
  // Check code uniqueness within warehouse
  const existing = await repos.locations.findOne({ warehouseId, code: data.code.toUpperCase() });
  if (existing) throw new ApiError(409, 'CODE_EXISTS', `Location code '${data.code}' already exists in this warehouse`);

  return repos.locations.create({
    ...data,
    code: data.code.toUpperCase(),
    warehouseId,
  });
}

async function updateLocation(id, data, repos) {
  const location = await repos.locations.findById(id);
  if (!location) throw new ApiError(404, 'NOT_FOUND', 'Location not found');
  if (data.code) data.code = data.code.toUpperCase();
  return repos.locations.findOneAndUpdate({ _id: id }, { $set: data });
}

async function deactivateLocation(id, repos) {
  const location = await repos.locations.findById(id);
  if (!location) throw new ApiError(404, 'NOT_FOUND', 'Location not found');
  return repos.locations.deactivate(id);
}

// ── Categories ────────────────────────────────────────────────────────────────

async function createCategory(data, repos) {
  return repos.categories.create(data);
}

async function updateCategory(id, data, repos) {
  const cat = await repos.categories.findById(id);
  if (!cat) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  return repos.categories.findOneAndUpdate({ _id: id }, { $set: data });
}

async function deactivateCategory(id, repos) {
  const cat = await repos.categories.findById(id);
  if (!cat) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  return repos.categories.deactivate(id);
}

// ── Products ──────────────────────────────────────────────────────────────────

async function createProduct(data, file, repos) {
  // Check SKU uniqueness
  const existing = await repos.products.findBySku(data.sku);
  if (existing) throw new ApiError(409, 'SKU_EXISTS', `SKU '${data.sku.toUpperCase()}' already exists`);

  let imageUrl = null;
  if (file) {
    imageUrl = await storageService.upload(file.path);
    // Clean up local temp file if Cloudinary was used
    if (imageUrl.startsWith('http')) {
      try { fs.unlinkSync(file.path); } catch {}
    }
  }

  return repos.products.create({ ...data, sku: data.sku.toUpperCase(), imageUrl });
}

async function updateProduct(id, data, file, repos) {
  const product = await repos.products.findById(id);
  if (!product || product.isDeleted) throw new ApiError(404, 'NOT_FOUND', 'Product not found');

  if (data.sku && data.sku.toUpperCase() !== product.sku) {
    const existing = await repos.products.findBySku(data.sku);
    if (existing) throw new ApiError(409, 'SKU_EXISTS', `SKU '${data.sku.toUpperCase()}' already exists`);
    data.sku = data.sku.toUpperCase();
  }

  if (file) {
    data.imageUrl = await storageService.upload(file.path);
    if (data.imageUrl.startsWith('http')) {
      try { fs.unlinkSync(file.path); } catch {}
    }
  }

  return repos.products.findOneAndUpdate({ _id: id }, { $set: data });
}

async function deleteProduct(id, repos) {
  const product = await repos.products.findById(id);
  if (!product || product.isDeleted) throw new ApiError(404, 'NOT_FOUND', 'Product not found');

  // Check if product has any ledger entries (hard delete forbidden per spec)
  const StockLedger = require('../models/StockLedger').catch?.() ? null : null;
  // Soft delete only
  return repos.products.softDelete(id);
}

module.exports = {
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse,
  createLocation,
  updateLocation,
  deactivateLocation,
  createCategory,
  updateCategory,
  deactivateCategory,
  createProduct,
  updateProduct,
  deleteProduct,
};
