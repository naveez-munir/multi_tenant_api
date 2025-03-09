import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../common/services/base.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { DocumentDto, EducationHistoryDto, ExperienceDto} from '../../common/dto/index';
import { StaffDetailResponseDto, StaffListResponseDto } from './dto/staff-list-response.dto';
import { SearchStaffDto } from './dto/search-staff.dto';
import { EmergencyContactDto } from './dto/create-staff.dto';
import { Staff, StaffSchema } from './schema/staff.schema';

@Injectable()
export class StaffService extends BaseService<Staff> {
  constructor() {
    super('Staff', StaffSchema);
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} ID format`);
    }
  }

  async createStaff(
    connection: Connection, 
    createDto: CreateStaffDto
  ): Promise<StaffListResponseDto> {
    try {
      const repository = this.getRepository(connection);

      const staffData = {
        ...createDto,
        ...(createDto.userId && {
          userId: new Types.ObjectId(createDto.userId.toString())
        })
      };

      const newStaff = await repository.create(staffData);
      
      return StaffListResponseDto.fromEntity(newStaff);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('A staff member with this CNI Number or Email already exists');
      }
      throw error;
    }
  }

  async searchStaff(
    connection: Connection, 
    searchDto: SearchStaffDto
  ) {
    try {
      const repository = this.getRepository(connection);
      const query: Record<string, any> = {};

      if (searchDto.firstName) {
        query.firstName = { $regex: searchDto.firstName, $options: 'i' };
      }
      if (searchDto.lastName) {
        query.lastName = { $regex: searchDto.lastName, $options: 'i' };
      }
      if (searchDto.cniNumber) {
        query.cniNumber = searchDto.cniNumber;
      }
      if (searchDto.employmentStatus) {
        query.employmentStatus = searchDto.employmentStatus;
      }
      if (searchDto.designation) {
        query.designation = searchDto.designation;
      }
      if (searchDto.department) {
        query.department = { $regex: searchDto.department, $options: 'i' };
      }
      if (searchDto.gender) {
        query.gender = searchDto.gender;
      }

      const staffMembers = await repository.findWithOptions(query, {
        sort: { firstName: 1, lastName: 1 }
      });
      
      return staffMembers.map(staff => StaffListResponseDto.fromEntity(staff));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to search staff members');
    }
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Staff> {
    try {
      this.validateObjectId(id, 'staff');
      const repository = this.getRepository(connection);

      const staff = await repository.findWithOptions(
        { _id: new Types.ObjectId(id) },
        {
          populate: {
            path: 'userId',
            select: 'email'
          }
        }
      );

      if (!staff || !staff.length) {
        throw new NotFoundException('Staff member not found');
      }

      return staff[0];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch staff member');
    }
  }

  async getStaffDetail(
    connection: Connection,
    id: string
  ): Promise<StaffDetailResponseDto> {
    const staff = await this.findById(connection, id);
    return StaffDetailResponseDto.fromEntity(staff);
  }

  async updateStaffById(
    connection: Connection,
    id: string,
    updateDto: UpdateStaffDto
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(id, 'staff');
      const repository = this.getRepository(connection);
      
      const updateData = {
        ...updateDto,
        ...(updateDto.userId && {
          userId: new Types.ObjectId(updateDto.userId.toString())
        })
      };

      await repository.findByIdAndUpdate(id, updateData);

      const updatedStaff = await repository.findById(id);

      if (!updatedStaff) {
        throw new NotFoundException('Staff member not found');
      }

      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update staff member');
    }
  }

  async addEducationHistory(
    connection: Connection,
    staffId: string,
    education: EducationHistoryDto
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);
      
      const staff = await repository.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const educationHistory = staff.educationHistory || [];
      educationHistory.push(education);

      await repository.findByIdAndUpdate(staffId, { educationHistory });

      const updatedStaff = await repository.findById(staffId);
      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add education history');
    }
  }

  async addExperience(
    connection: Connection,
    staffId: string,
    experience: ExperienceDto
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);
      
      const staff = await repository.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const experienceList = staff.experience || [];
      experienceList.push(experience);

      await repository.findByIdAndUpdate(staffId, { experience: experienceList });

      const updatedStaff = await repository.findById(staffId);
      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add experience');
    }
  }

  async addDocument(
    connection: Connection,
    staffId: string,
    document: DocumentDto
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);
      
      const staff = await repository.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const documents = staff.documents || [];
      documents.push({ ...document, uploadDate: new Date() });

      await repository.findByIdAndUpdate(staffId, { documents });

      const updatedStaff = await repository.findById(staffId);
      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add document');
    }
  }

  async updateEmergencyContact(
    connection: Connection,
    staffId: string,
    emergencyContact: EmergencyContactDto
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);
      
      const staff = await repository.findById(staffId);
      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      await repository.findByIdAndUpdate(staffId, { emergencyContact });

      const updatedStaff = await repository.findById(staffId);
      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update emergency contact');
    }
  }

  async updateStaffStatus(
    connection: Connection,
    staffId: string,
    employmentStatus: string
  ): Promise<StaffListResponseDto> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);

      await repository.findByIdAndUpdate(staffId, { employmentStatus });

      const updatedStaff = await repository.findById(staffId);

      if (!updatedStaff) {
        throw new NotFoundException('Staff member not found');
      }

      return StaffListResponseDto.fromEntity(updatedStaff);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update staff status');
    }
  }

  async deleteStaff(
    connection: Connection,
    staffId: string
  ): Promise<boolean> {
    try {
      this.validateObjectId(staffId, 'staff');
      const repository = this.getRepository(connection);
      
      const result = await repository.delete(staffId);
      if (!result) {
        throw new NotFoundException('Staff member not found');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete staff member');
    }
  }
}
