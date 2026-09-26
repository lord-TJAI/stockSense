'use strict';

const Organization = require('../models/Organization');

/**
 * Organization repository — NOT tenant-scoped (organizations are top-level).
 * No organizationId filter; queried by slug or _id directly.
 */
class OrganizationRepository {
  async create(data) {
    return Organization.create(data);
  }

  async findById(id) {
    return Organization.findById(id);
  }

  async findBySlug(slug) {
    return Organization.findOne({ slug });
  }

  async findOne(filter) {
    return Organization.findOne(filter);
  }

  async update(id, data) {
    return Organization.findByIdAndUpdate(id, data, { new: true });
  }

  async slugExists(slug) {
    return !!(await Organization.findOne({ slug }));
  }
}

module.exports = new OrganizationRepository();
