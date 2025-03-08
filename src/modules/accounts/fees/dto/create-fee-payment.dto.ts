import { Type } from "class-transformer";
import { 
  IsMongoId, 
  IsDate, 
  IsEnum, 
  IsNumber, 
  Min, 
  IsOptional, 
  IsString, 
  IsArray, 
  ValidateNested,
  IsNotEmpty
} from "class-validator";

// Define enum for payment modes (should match schema)
export enum PaymentMode {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER'
}

// Define enum for payment status
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export class CreateFeePaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  studentFeeId: string;

  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(PaymentMode)
  @IsNotEmpty()
  paymentMode: PaymentMode;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateChargesPaid?: number;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  chequeNumber?: string;

  @IsString()
  @IsOptional()
  bankDetails?: string;

  @IsMongoId()
  @IsOptional()
  collectedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkFeePaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeePaymentDto)
  payments: CreateFeePaymentDto[];
}

export class UpdateFeePaymentStatusDto {
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class FeePaymentFilterDto {
  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  academicYear?: string;
}
