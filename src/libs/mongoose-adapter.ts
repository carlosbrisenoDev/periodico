import type { Aggregate, Model, Query } from 'mongoose';

export class QueryAdapter<T> {
  constructor(private query: Query<any, any>) {}

  sort(sort: Record<string, 1 | -1>): this {
    this.query = this.query.sort(sort);
    return this;
  }

  limit(limit: number): this {
    this.query = this.query.limit(limit);
    return this;
  }

  skip(skip: number): this {
    this.query = this.query.skip(skip);
    return this;
  }

  project(fields: Record<string, unknown>): this {
    this.query = this.query.select(fields as any);
    return this;
  }

  select(fields: string | Record<string, unknown>): this {
    this.query = this.query.select(fields as any);
    return this;
  }

  async toArray(): Promise<T[]> {
    return (await this.query.lean().exec()) as T[];
  }
}

export class AggregateAdapter<T> {
  constructor(private aggregate: Aggregate<T[]>) {}

  async toArray(): Promise<T[]> {
    return this.aggregate.exec();
  }
}

export const createCollectionAdapter = <T>(model: Model<T>) => ({
  findOne: async (filter: any): Promise<T | null> => (await model.findOne(filter).lean().exec()) as T | null,
  find: (filter: any): QueryAdapter<T> => new QueryAdapter<T>(model.find(filter)),
  insertOne: async (doc: Partial<T>): Promise<{ insertedId: any }> => {
    const created = await model.create(doc);
    return { insertedId: (created as any)._id };
  },
  findOneAndUpdate: async (
    filter: any,
    update: any,
    options: { returnDocument?: 'before' | 'after' } = { returnDocument: 'after' }
  ): Promise<T | null> =>
    (await model
      .findOneAndUpdate(filter, update, {
        new: options.returnDocument === 'after',
        lean: true
      })
      .exec()) as T | null,
  deleteOne: async (filter: any): Promise<{ deletedCount: number }> => {
    const result = await model.deleteOne(filter).exec();
    return { deletedCount: result.deletedCount ?? 0 };
  },
  findOneAndDelete: async (filter: any): Promise<T | null> =>
    (await model.findOneAndDelete(filter).lean().exec()) as T | null,
  updateOne: async (filter: any, update: any): Promise<{ matchedCount: number }> => {
    const result = await model.updateOne(filter, update).exec();
    return { matchedCount: result.matchedCount ?? 0 };
  },
  countDocuments: async (filter: any): Promise<number> => model.countDocuments(filter).exec(),
  aggregate: <R = T>(pipeline: unknown[]): AggregateAdapter<R> =>
    new AggregateAdapter<R>(model.aggregate(pipeline as any) as Aggregate<R[]>)
});
