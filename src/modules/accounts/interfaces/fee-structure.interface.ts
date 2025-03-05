import { Types } from 'mongoose';

interface IFeeComponent {
  feeCategory: Types.ObjectId;
  amount: number;
  dueDay?: number;
  lateChargeType?: 'FIXED' | 'PERCENTAGE';
  lateChargeValue?: number;
  gracePeriod?: number;
  isOptional?: boolean;
  discountAllowed?: boolean;
}
export interface IFeeStructure {
  academicYear: string;
  classId: Types.ObjectId;
  feeComponents: IFeeComponent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidateFeeStructureInput {
  academicYear: string;
  classId: string;
  feeComponents?: IFeeComponent[];
}
