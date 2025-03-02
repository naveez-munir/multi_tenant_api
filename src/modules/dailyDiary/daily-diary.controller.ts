import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Put, 
  Query, 
  Req, 
  Delete, 
  UseGuards,
  HttpStatus,
  HttpCode 
} from "@nestjs/common";
import { TenantGuard } from "src/modules/tenant/guards/tenant.guard";
import { DailyDiaryService } from "./daily-diary.service";
import { CurrentTenant } from "src/common/decorators/tenant.decorator";
import { Tenant } from "src/modules/tenant/schemas/tenant.schema";
import { CreateDailyDiaryDto } from "./dto/create-daily-diary.dto";
import { DiaryQueryDto } from "./dto/diary-query.dto";
import { UpdateDailyDiaryDto } from "./dto/update-daily-diary.dto";
import { AttachmentDto } from "./dto/attachment.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Request } from "express";

@Controller('daily-diary')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DailyDiaryController {
  constructor(private readonly dailyDiaryService: DailyDiaryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Body() createDto: CreateDailyDiaryDto,
  ) {
    try {
      return this.dailyDiaryService.createDiaryEntry(
        req['tenantConnection'],
        createDto,
        req['userId']
      );
    } catch (error) {
      console.log(error)
    }
  }

  @Get()
  async findAll(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Query() query: DiaryQueryDto
  ) {
    return this.dailyDiaryService.findAll(
      req['tenantConnection'],
      query
    );
  }

  @Get(':id')
  async getById(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    return this.dailyDiaryService.getDiaryEntry(
      req['tenantConnection'],
      id
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
    @Body() updateDto: UpdateDailyDiaryDto
  ) {
    return this.dailyDiaryService.updateDiaryEntry(
      req['tenantConnection'],
      id,
      updateDto,
      req['userId']
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.dailyDiaryService.deleteDiaryEntry(
      req['tenantConnection'],
      id,
      req['userId']
    );
  }

  @Post(':id/attachments')
  async addAttachment(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() attachment: AttachmentDto
  ) {
    return this.dailyDiaryService.addAttachment(
      req['tenantConnection'],
      id,
      attachment,
      req['userId']
    );
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAttachment(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.dailyDiaryService.removeAttachment(
      req['tenantConnection'],
      id,
      attachmentId,
      req['userId']
    );
  }
}
