'use strict';

/**
 * Build a standard pagination object from query params.
 * @param {object} query - Express req.query
 * @returns {{ page, limit, skip }}
 */
function getPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for the response envelope.
 * @param {number} total - total matching documents
 * @param {{ page, limit }} params
 */
function paginationMeta(total, { page, limit }) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

module.exports = { getPagination, paginationMeta };
