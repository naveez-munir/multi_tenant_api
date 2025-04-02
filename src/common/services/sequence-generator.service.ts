import { Injectable, BadRequestException } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { Counter, CounterSchema } from '../schemas/counter.schema';

@Injectable()
export class SequenceGeneratorService {
  async getNextSequence(
    connection: Connection, 
    sequenceName: string, 
    startValue = 10000
  ): Promise<number> {
    try {
      const CounterModel: Model<Counter> = connection.models['Counter'] || 
                           connection.model<Counter>('Counter', CounterSchema);

      let counter = await CounterModel.findOne({ name: sequenceName }).exec();
      if (!counter) {
        counter = await CounterModel.create({
          name: sequenceName,
          seq: startValue
        });
      }
      
      counter = await CounterModel.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      ).exec();

      return counter.seq;
    } catch (error) {
      console.error(`Error generating sequence '${sequenceName}':`, error);
      throw new BadRequestException(`Failed to generate sequence number: ${error.message}`);
    }
  }
}
