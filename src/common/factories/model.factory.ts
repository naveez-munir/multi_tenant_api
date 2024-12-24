import { Connection, Schema, Model } from 'mongoose';

export class ModelFactory {
  static createForConnection<T>(
    connection: Connection,
    name: string,
    schema: Schema,
  ): Model<T> {
    return connection.model<T>(name, schema);
  }
}
