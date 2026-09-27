'use strict';

const dashSvc = require('../services/dashboardService');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginationMeta } = require('../utils/pagination');

async function getKpiSummary(req, res) {
  const data = await dashSvc.getKpiSummary(req.user.organizationId);
  res.json(new ApiResponse(200, 'Dashboard KPIs', data));
}

async function getLowStockAlerts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { alerts, total } = await dashSvc.getLowStockAlerts(req.user.organizationId, { skip, limit });
  res.json(new ApiResponse(200, 'Low-stock alerts', {
    alerts,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getOutOfStockAlerts(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { products, total } = await dashSvc.getOutOfStockAlerts(req.user.organizationId, { skip, limit });
  res.json(new ApiResponse(200, 'Out-of-stock alerts', {
    products,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

async function getProductStockSnapshot(req, res) {
  const data = await dashSvc.getProductStockSnapshot(req.user.organizationId, req.params.productId);
  res.json(new ApiResponse(200, 'Product stock snapshot', data));
}

module.exports = { getKpiSummary, getLowStockAlerts, getOutOfStockAlerts, getProductStockSnapshot };
