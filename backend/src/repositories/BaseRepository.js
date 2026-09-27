'use strict';

/**
 * Base repository for tenant-scoped models.
 *
 * Every instance is constructed with a specific organizationId. All query
 * methods automatically inject { organizationId } into the filter so individual
 * repository functions can never accidentally omit it.
 *
 * If an instance is constructed WITHOUT an organizationId, any query method
 * throws immediately — this makes it impossible to silently query across all
 * organizations.
 *
 * Usage: via req.repos (built by tenantScope middleware), never constructed
 * directly with a null/undefined organizationId in application code.
 */
class BaseRepository {
  constructor(Model, organizationId) {
    this.Model = Model;
    this.organizationId = organizationId || null;
  }

  /** Throws if this instance has no tenant context. */
  _requireTenantContext() {
    if (!this.organizationId) {
      throw new Error(
        `[TenantScope] A repository method was called on model "${this.Model.modelName}" ` +
          `without a tenant context (organizationId is missing). ` +
          `Always access tenant-scoped repositories through req.repos.`
      );
    }
  }

  /** Returns a filter object that always includes organizationId. */
  _scope(filter = {}) {
    this._requireTenantContext();
    return { ...filter, organizationId: this.organizationId };
  }

  async find(filter = {}, projection = null, options = {}) {
    return this.Model.find(this._scope(filter), projection, options);
  }

  async findOne(filter = {}) {
    return this.Model.findOne(this._scope(filter));
  }

  async findById(id) {
    return this.Model.findOne(this._scope({ _id: id }));
  }

  async create(data, session = null) {
    this._requireTenantContext();
    const opts = session ? { session } : {};
    const [doc] = await this.Model.create([{ ...data, organizationId: this.organizationId }], opts);
    return doc;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    return this.Model.findOneAndUpdate(this._scope(filter), update, { new: true, ...options });
  }

  async updateMany(filter, update, options = {}) {
    return this.Model.updateMany(this._scope(filter), update, options);
  }

  async countDocuments(filter = {}) {
    return this.Model.countDocuments(this._scope(filter));
  }

  async deleteOne(filter = {}) {
    return this.Model.deleteOne(this._scope(filter));
  }

  async softDelete(filter = {}) {
    return this.Model.findOneAndUpdate(
      this._scope(filter),
      { $set: { isActive: false, deletedAt: new Date() } },
      { new: true }
    );
  }
}

module.exports = BaseRepository;
