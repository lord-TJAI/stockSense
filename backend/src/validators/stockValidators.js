'use strict';

const { z } = require('zod');

const lineBaseSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity:  z.coerce.number().positive('Quantity must be positive'),
  unitCost:  z.coerce.number().min(0).optional(),
});

const receiptLineSchema = lineBaseSchema.extend({
  toLocationId: z.string().min(1, 'toLocationId is required'),
});

const deliveryLineSchema = lineBaseSchema.extend({
  fromLocationId: z.string().min(1, 'fromLocationId is required'),
});

const transferLineSchema = lineBaseSchema.extend({
  fromLocationId: z.string().min(1, 'fromLocationId is required'),
  toLocationId:   z.string().min(1, 'toLocationId is required'),
});

const adjustmentLineSchema = z.object({
  productId:   z.string().min(1, 'productId is required'),
  locationId:  z.string().min(1, 'locationId is required'),
  newQuantity: z.coerce.number().min(0, 'newQuantity must be >= 0'),
});

const notesAndRef = {
  notes:        z.string().max(500).optional().default(''),
  referenceDoc: z.string().max(100).optional(),
};

const receiptSchema = z.object({
  lines: z.array(receiptLineSchema).min(1),
  ...notesAndRef,
});

const deliverySchema = z.object({
  lines: z.array(deliveryLineSchema).min(1),
  ...notesAndRef,
});

const transferSchema = z.object({
  lines: z.array(transferLineSchema).min(1),
  ...notesAndRef,
});

const adjustmentSchema = z.object({
  lines: z.array(adjustmentLineSchema).min(1),
  notes: z.string().max(500).optional().default(''),
});

module.exports = {
  receiptSchema,
  deliverySchema,
  transferSchema,
  adjustmentSchema,
};
