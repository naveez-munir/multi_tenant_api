import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { TenantGuard } from "src/modules/tenant/guards/tenant.guard";
import { DailyDiaryService } from "./daily-diary.service";
import { CurrentTenant } from "src/common/decorators/tenant.decorator";
import { Tenant } from "src/modules/tenant/schemas/tenant.schema";
import { CreateDailyDiaryDto } from "./dto/create-daily-diary.dto";
import { User } from "src/modules/users/schemas/user.schema";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { DiaryQueryDto } from "./dto/diary-query.dto";

@Controller('daily-diary')
@UseGuards(TenantGuard)
export class DailyDiaryController {
  constructor(private readonly dailyDiaryService: DailyDiaryService) {}

  @Post()
  async create(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Body() createDto: CreateDailyDiaryDto,
    @CurrentUser() user: User //TODO handle the case for current user
  ) {
    return this.dailyDiaryService.createDiaryEntry(
      req['tenantConnection'],
      createDto,
      user._id.toString()
    );
  }

  @Get('class/:classId')
  async getByClass(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('classId') classId: string,
    @Query() query: DiaryQueryDto
  ) {
    return this.dailyDiaryService.getDiaryEntriesByClass(
      req['tenantConnection'],
      classId,
      query
    );
  }

  @Get('student/:studentId')
  async getForStudent(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('studentId') studentId: string,
    @Query() query: DiaryQueryDto
  ) {
    return this.dailyDiaryService.getDiaryEntriesForStudent(
      req['tenantConnection'],
      studentId,
      query
    );
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateDailyDiaryDto>,
    @CurrentUser() user: User
  ) {
    return this.dailyDiaryService.updateDiaryEntry(
      req['tenantConnection'],
      id,
      updateDto,
      user._id.toString()
    );
  }
}
