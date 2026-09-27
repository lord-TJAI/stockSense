'use strict';

const stockService = require('../services/stockMutationService');
const stockLevelRepo = require('../repositories/stockLevelRepository');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { getPagination, paginationMeta } = require('../utils/pagination');

// ── Shared builder for mutation params ────────────────────────────────────────
function mutationParams(req) {
  return {
    organizationId: req.repos.ledger.organizationId,
    lines:          req.body.lines,
    notes:          req.body.notes,
    referenceDoc:   req.body.referenceDoc,
    createdBy:      req.user.userId,
    ledgerRepo:     req.repos.ledger,
  };
}

// ── Receipts ──────────────────────────────────────────────────────────────────
async function createReceipt(req, res) {
  const doc = await stockService.receiveStock(mutationParams(req));
  res.status(201).json(new ApiResponse(201, 'Receipt recorded', doc));
}

async function listReceipts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { docs, total } = await req.repos.ledger.listByType('receipt', { skip, limit });
  res.json(new ApiResponse(200, 'Receipts retrieved', {
    docs, pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getReceipt(req, res) {
  const doc = await req.repos.ledger.findById(req.params.id);
  if (!doc || doc.docType !== 'receipt') throw new ApiError(404, 'NOT_FOUND', 'Receipt not found');
  res.json(new ApiResponse(200, 'Receipt retrieved', doc));
}

// ── Deliveries ────────────────────────────────────────────────────────────────
async function createDelivery(req, res) {
  const doc = await stockService.deliverStock(mutationParams(req));
  res.status(201).json(new ApiResponse(201, 'Delivery recorded', doc));
}

async function listDeliveries(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { docs, total } = await req.repos.ledger.listByType('delivery', { skip, limit });
  res.json(new ApiResponse(200, 'Deliveries retrieved', {
    docs, pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getDelivery(req, res) {
  const doc = await req.repos.ledger.findById(req.params.id);
  if (!doc || doc.docType !== 'delivery') throw new ApiError(404, 'NOT_FOUND', 'Delivery not found');
  res.json(new ApiResponse(200, 'Delivery retrieved', doc));
}

// ── Transfers ─────────────────────────────────────────────────────────────────
async function createTransfer(req, res) {
  const doc = await stockService.transferStock(mutationParams(req));
  res.status(201).json(new ApiResponse(201, 'Transfer recorded', doc));
}

async function listTransfers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { docs, total } = await req.repos.ledger.listByType('transfer', { skip, limit });
  res.json(new ApiResponse(200, 'Transfers retrieved', {
    docs, pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getTransfer(req, res) {
  const doc = await req.repos.ledger.findById(req.params.id);
  if (!doc || doc.docType !== 'transfer') throw new ApiError(404, 'NOT_FOUND', 'Transfer not found');
  res.json(new ApiResponse(200, 'Transfer retrieved', doc));
}

// ── Adjustments ───────────────────────────────────────────────────────────────
async function createAdjustment(req, res) {
  const doc = await stockService.adjustStock({
    organizationId: req.repos.ledger.organizationId,
    lines:      req.body.lines,
    notes:      req.body.notes,
    createdBy:  req.user.userId,
    ledgerRepo: req.repos.ledger,
  });
  res.status(201).json(new ApiResponse(201, 'Adjustment recorded', doc));
}

async function listAdjustments(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { docs, total } = await req.repos.ledger.listByType('adjustment', { skip, limit });
  res.json(new ApiResponse(200, 'Adjustments retrieved', {
    docs, pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getAdjustment(req, res) {
  const doc = await req.repos.ledger.findById(req.params.id);
  if (!doc || doc.docType !== 'adjustment') throw new ApiError(404, 'NOT_FOUND', 'Adjustment not found');
  res.json(new ApiResponse(200, 'Adjustment retrieved', doc));
}

// ── Stock levels (current) ────────────────────────────────────────────────────
async function getStockLevels(req, res) {
  const { productId, locationId } = req.query;
  const orgId = req.repos.ledger.organizationId;

  let levels;
  if (productId) {
    levels = await stockLevelRepo.findForProduct(orgId, productId);
  } else if (locationId) {
    levels = await stockLevelRepo.findForLocation(orgId, locationId);
  } else {
    throw new ApiError(400, 'MISSING_FILTER', 'Provide productId or locationId query param');
  }
  res.json(new ApiResponse(200, 'Stock levels retrieved', levels));
}

// ── Product stock history ─────────────────────────────────────────────────────
async function getProductHistory(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { docs, total } = await req.repos.ledger.listForProduct(req.params.productId, { skip, limit });
  res.json(new ApiResponse(200, 'Stock history retrieved', {
    docs, pagination: paginationMeta(total, { page, limit }),
  }));
}

module.exports = {
  createReceipt, listReceipts, getReceipt,
  createDelivery, listDeliveries, getDelivery,
  createTransfer, listTransfers, getTransfer,
  createAdjustment, listAdjustments, getAdjustment,
  getStockLevels, getProductHistory,
};
