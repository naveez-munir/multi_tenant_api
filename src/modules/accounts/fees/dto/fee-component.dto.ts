export interface FeeComponentDto {
  feeCategory: string;
  amount: number;
  dueDay: number;
  lateChargeType?: string;
  lateChargeValue?: number;
}
