import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TenantConfig extends Document {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ type: Object, default: {} })
  settings: {
    theme?: {
      primaryColor?: string;
      logo?: string;
    };
    features?: {
      enableChat?: boolean;
      enableNotifications?: boolean;
    };
    limits?: {
      maxUsers?: number;
      maxStorage?: number;
    };
  };

  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>;
}

export const TenantConfigSchema = SchemaFactory.createForClass(TenantConfig);
