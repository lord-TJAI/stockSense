'use strict';

const { z } = require('zod');

const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
  address: z.string().max(300).optional().default(''),
});

const updateWarehouseSchema = createWarehouseSchema.partial();

const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/i),
  parentLocationId: z.string().optional().nullable(),
});

const updateLocationSchema = createLocationSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentCategory: z.string().optional().nullable(),
});

const updateCategorySchema = createCategorySchema.partial();

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  categoryId: z.string().optional().nullable(),
  unitOfMeasure: z.string().min(1).max(20).default('pcs'),
  reorderPoint: z.coerce.number().min(0).default(0),
  reorderQty: z.coerce.number().min(0).default(0),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createWarehouseSchema,
  updateWarehouseSchema,
  createLocationSchema,
  updateLocationSchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
};
