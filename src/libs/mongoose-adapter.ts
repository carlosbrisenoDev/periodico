import type { Aggregate, Model, Query, UpdateQuery } from 'mongoose';

type QueryFilter = Record<string, any>;
type ProjectionFields = string | readonly string[] | Record<string, string | number | boolean | object>;

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

  project(fields: ProjectionFields): this {
    this.query = this.query.select(fields);
    return this;
  }

  select(fields: ProjectionFields): this {
    this.query = this.query.select(fields);
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
  findOne: async (filter: QueryFilter): Promise<T | null> =>
    (await model.findOne(filter as any).lean().exec()) as T | null,
  find: (filter: QueryFilter): QueryAdapter<T> => new QueryAdapter<T>(model.find(filter as any)),
  insertOne: async (doc: Partial<T>): Promise<{ insertedId: unknown }> => {
    const created = await model.create(doc);
    return { insertedId: (created as any)._id };
  },
  findOneAndUpdate: async (
    filter: QueryFilter,
    update: UpdateQuery<T>,
    options: { returnDocument?: 'before' | 'after' } = { returnDocument: 'after' }
  ): Promise<T | null> =>
    (await model
      .findOneAndUpdate(filter as any, update, {
        new: options.returnDocument === 'after',
        lean: true
      })
      .exec()) as T | null,
  deleteOne: async (filter: QueryFilter): Promise<{ deletedCount: number }> => {
    const result = await model.deleteOne(filter as any).exec();
    return { deletedCount: result.deletedCount ?? 0 };
  },
  findOneAndDelete: async (filter: QueryFilter): Promise<T | null> =>
    (await model.findOneAndDelete(filter as any).lean().exec()) as T | null,
  updateOne: async (filter: QueryFilter, update: UpdateQuery<T>): Promise<{ matchedCount: number }> => {
    const result = await model.updateOne(filter as any, update as any).exec();
    return { matchedCount: result.matchedCount ?? 0 };
  },
  countDocuments: async (filter: QueryFilter): Promise<number> => model.countDocuments(filter as any).exec(),
  aggregate: <R = T>(pipeline: unknown[]): AggregateAdapter<R> => new AggregateAdapter<R>(model.aggregate(pipeline as any) as Aggregate<R[]>)
});
