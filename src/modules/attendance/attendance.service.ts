import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { Connection, Types } from "mongoose";
import { BaseService } from "../../common/services/base.service";
import { Attendance, AttendanceSchema } from "./schema/attendance.schema";
import { StudentSchema } from "../student/schemas/student.schema";
import { TeacherSchema } from "../teacher/schemas/teacher.schema";
import { ClassSchema } from "../class/schemas/class.schema";
import { AttendanceStatus } from "src/common/interfaces/attendanceStatuses";
import { AttendanceResponseDto, BatchCreateResponseDto, ClassAttendanceReportDto, CreateAttendanceResponseDto, MonthlyAttendanceReportDto, UserAttendanceReportDto } from "./dto/response";
import { CreateAttendanceDto } from "./dto/create-attendance-dto";
import { UpdateAttendanceDto } from "./dto/update-attendance-dto";
import { BatchAttendanceDto, ClassAttendanceFilterDto, MonthlyReportFilterDto, UserAttendanceFilterDto } from "./dto/batch-attendance.dto";
import { AttendanceType } from "src/common/interfaces/attendanceType";

@Injectable()
export class AttendanceService extends BaseService<Attendance> {
  constructor() {
    super("Attendance", AttendanceSchema);
  }

  private async initializeModels(connection: Connection) {
    try {
      if (!connection.models['Student']) {
        connection.model('Student', StudentSchema);
      }
      if (!connection.models['Teacher']) {
        connection.model('Teacher', TeacherSchema);
      }
      if (!connection.models['Class']) {
        connection.model('Class', ClassSchema);
      }
    } catch (error) {
      console.error('Model initialization error:', error);
      throw error;
    }
  }

  private transformToAttendanceResponse(data: any): AttendanceResponseDto {
    return {
      id: data._id.toString(),
      user: {
        id: data.userId._id.toString(),
        name: `${data.userId.firstName} ${data.userId.lastName}`,
        rollNumber: data.userId.rollNumber,
        employeeId: data.userId.employeeId,
        type: data.userType
      },
      class: data.classId ? {
        id: data.classId._id.toString(),
        className: data.classId.className,
        section: data.classId.classSection
      } : undefined,
      date: data.date.toISOString(),
      status: data.status,
      reason: data.reason,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString()
    };
  }

  async createAttendance(
    connection: Connection, 
    createDto: CreateAttendanceDto
  ): Promise<CreateAttendanceResponseDto> {
    try {
      const repository = this.getRepository(connection);
      const { classId, ...otherFields } = createDto;
      const data = {
        ...otherFields,
        ...(classId ? { classId: new Types.ObjectId(classId) } : {})
      };
      const attendance = await repository.create(data);
      return {
        success: true,
        message: "Attendance record created successfully",
        id: attendance._id.toString()
      };
    } catch (error) {
      console.error('Error creating attendance record:', error);
      if (error.code === 11000) {
        throw new ConflictException("Attendance record already exists for this user on this date");
      }
      throw error;
    }
  }

  async getAllAttendance(
    connection: Connection,
    filters: {
      userType?: AttendanceType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<AttendanceResponseDto[]> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    // Set default filters
    const query: any = {};
    
    // Default userType filter (STUDENT if not specified)
    if (filters.userType) {
      query.userType = filters.userType;
    } else {
      query.userType = AttendanceType.STUDENT;
    }
    
    // Default date range (last 5 days if not specified)
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 5);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Find records with populated references
    const options: any = {
      populate: { 
        path: 'userId classId'
      }
    };

    const records = await repository.findWithOptions(query, options);
  
    return records.map(record => this.transformToAttendanceResponse(record));
  }

  async getAttendanceById(
    connection: Connection, 
    id: string
  ): Promise<AttendanceResponseDto> {
    await this.initializeModels(connection);
    const repository = this.getRepository(connection);
    
    const attendance = await repository.findWithOptions(
      { _id: new Types.ObjectId(id) },
      {
        populate: { 
          path: 'userId classId'
        }
      }
    );

    if (!attendance || attendance.length === 0) {
      throw new NotFoundException('Attendance record not found');
    }

    return this.transformToAttendanceResponse(attendance[0]);
  }

  async updateAttendance(
    connection: Connection,
    id: string,
    updateDto: UpdateAttendanceDto
  ): Promise<CreateAttendanceResponseDto> {
    const repository = this.getRepository(connection);
    const { classId, ...otherFields } = updateDto;
      const data = {
        ...otherFields,
        ...(classId ? { classId: new Types.ObjectId(classId) } : {})
      };
    const updated = await repository.findByIdAndUpdate(id, data);
    if (!updated) {
      throw new NotFoundException('Attendance record not found');
    }

    return {
      success: true,
      message: "Attendance record updated successfully",
      id: updated._id.toString()
    };
  }

  async deleteAttendance(
    connection: Connection,
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const repository = this.getRepository(connection);
    const deleted = await repository.delete(id);
    
    if (!deleted) {
      throw new NotFoundException('Attendance record not found');
    }

    return {
      success: true,
      message: "Attendance record deleted successfully"
    };
  }

  async createBatchAttendance(
    connection: Connection,
    batchDto: BatchAttendanceDto
  ): Promise<BatchCreateResponseDto> {
    try {
      const repository = this.getRepository(connection);
      
      const attendanceRecords = batchDto.records.map(record => ({
        userType: batchDto.userType,
        classId: batchDto.classId || null,
        date: batchDto.date,
        userId: record.userId,
        status: record.status,
        reason: record.reason
      }));
  
      const created = await repository.insertMany(attendanceRecords);
  
      return {
        success: true,
        message: `Successfully created ${created.length} attendance records`,
        count: created.length,
        ids: created.map(record => record._id.toString())
      };
    } catch (error) {
      console.log(error)
    }
  }

  async getClassAttendanceReport(
    connection: Connection,
    classId: string,
    filter: ClassAttendanceFilterDto
  ) {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      
      const query: any = { 
        classId: new Types.ObjectId(classId) 
      };
      if (filter.startDate) query.date = { $gte: filter.startDate };
      if (filter.endDate) query.date.$lte = filter.endDate;
      if (filter.status) query.status = filter.status;
  
      const records = await repository.findWithOptions(query, {
        populate: { 
          path: 'userId classId'
        }
      });
  
      const attendanceRecords = records.map(record => this.transformToAttendanceResponse(record));
      
      const summary = {
        total: records.length,
        present: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
        absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: records.filter(r => r.status === AttendanceStatus.LATE).length,
        presentPercentage: records.length ? 
          (records.filter(r => r.status === AttendanceStatus.PRESENT).length / records.length) * 100 : 0
      };
      return {
        summary,
        class: records[0]?.classId ? {
          id: records[0].classId._id.toString(),
          // @ts-ignore
          className: records[0].classId.className,
          // @ts-ignore
          section: records[0].classId.classSection
        } : null,
        dateRange: {
          startDate: filter.startDate,
          endDate: filter.endDate
        },
        records: attendanceRecords
      };
    } catch (error) {
      console.log(error)
    }
  }

  async getUserAttendanceReport(
    connection: Connection,
    userId: string,
    filter: UserAttendanceFilterDto
  ): Promise<UserAttendanceReportDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      
      const query: any = { 
        userId: new Types.ObjectId(userId) 
      };
  
      if (filter.startDate) query.date = { $gte: filter.startDate };
      if (filter.endDate) query.date.$lte = filter.endDate;
      if (filter.userType) query.userType = filter.userType;
  
      const records = await repository.findWithOptions(query, {
        populate: { 
          path: 'userId classId'
        },
        sort: { date: -1 }
      });
  
      const attendanceRecords = records.map(record => this.transformToAttendanceResponse(record));
      
      const summary = {
        total: records.length,
        present: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
        absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: records.filter(r => r.status === AttendanceStatus.LATE).length,
        attendancePercentage: records.length ? 
          (records.filter(r => r.status === AttendanceStatus.PRESENT).length / records.length) * 100 : 0
      };
  
      return {
        user: attendanceRecords[0]?.user,
        summary,
        dateRange: {
          startDate: filter.startDate?.toISOString(),
          endDate: filter.endDate?.toISOString()
        },
        records: attendanceRecords
      };
    } catch (error) {
      console.log(error)
    }
  }

  async getMonthlyReport(
    connection: Connection,
    filter: MonthlyReportFilterDto
  ): Promise<MonthlyAttendanceReportDto> {
    try {
      await this.initializeModels(connection);
      const repository = this.getRepository(connection);
      
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 0);
  
      const query: any = {
        date: { $gte: startDate, $lte: endDate }
      };
  
      if (filter.userType) query.userType = filter.userType;
      if (filter.classId) query.classId = filter.classId;
  
      const records = await repository.findWithOptions(query, {
        populate: { 
          path: 'userId classId'
        }
      });
  
      const dailyReport = {};
      records.forEach(record => {
        const day = record.date.getDate();
        if (!dailyReport[day]) {
          dailyReport[day] = {
            present: 0,
            absent: 0,
            late: 0,
            total: 0
          };
        }
        dailyReport[day][record.status.toLowerCase()]++;
        dailyReport[day].total++;
      });
  
      const summary = {
        total: records.length,
        present: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
        absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: records.filter(r => r.status === AttendanceStatus.LATE).length,
        averageAttendance: records.length ? 
          (records.filter(r => r.status === AttendanceStatus.PRESENT).length / records.length) * 100 : 0
      };
  
      return {
        month: filter.month,
        year: filter.year,
        summary,
        dailyReport,
        filter: {
          userType: filter.userType,
          class: records[0]?.classId ? {
            id: records[0].classId._id.toString(),
            // @ts-ignore
            className: records[0].classId?.className,
            // @ts-ignore
            section: records[0].classId.classSection
          } : undefined
        }
      };
    } catch (error) {
      console.log('>>>>>>>>>',error)
    }
  }
}
