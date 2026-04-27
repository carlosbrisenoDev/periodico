export class QueryAdapter {
    query;
    constructor(query) {
        this.query = query;
    }
    sort(sort) {
        this.query = this.query.sort(sort);
        return this;
    }
    limit(limit) {
        this.query = this.query.limit(limit);
        return this;
    }
    skip(skip) {
        this.query = this.query.skip(skip);
        return this;
    }
    project(fields) {
        this.query = this.query.select(fields);
        return this;
    }
    select(fields) {
        this.query = this.query.select(fields);
        return this;
    }
    async toArray() {
        return (await this.query.lean().exec());
    }
}
export class AggregateAdapter {
    aggregate;
    constructor(aggregate) {
        this.aggregate = aggregate;
    }
    async toArray() {
        return this.aggregate.exec();
    }
}
export const createCollectionAdapter = (model) => ({
    findOne: async (filter) => (await model.findOne(filter).lean().exec()),
    find: (filter) => new QueryAdapter(model.find(filter)),
    insertOne: async (doc) => {
        const created = await model.create(doc);
        return { insertedId: created._id };
    },
    findOneAndUpdate: async (filter, update, options = { returnDocument: 'after' }) => (await model
        .findOneAndUpdate(filter, update, {
        new: options.returnDocument === 'after',
        lean: true
    })
        .exec()),
    deleteOne: async (filter) => {
        const result = await model.deleteOne(filter).exec();
        return { deletedCount: result.deletedCount ?? 0 };
    },
    findOneAndDelete: async (filter) => (await model.findOneAndDelete(filter).lean().exec()),
    updateOne: async (filter, update) => {
        const result = await model.updateOne(filter, update).exec();
        return { matchedCount: result.matchedCount ?? 0 };
    },
    countDocuments: async (filter) => model.countDocuments(filter).exec(),
    aggregate: (pipeline) => new AggregateAdapter(model.aggregate(pipeline))
});
