import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyDiaryDto } from './create-daily-diary.dto';

export class UpdateDailyDiaryDto extends PartialType(CreateDailyDiaryDto) {}
