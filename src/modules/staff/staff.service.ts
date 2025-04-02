import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { BaseService } from '../../common/services/base.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { DocumentDto, EducationHistoryDto, ExperienceDto} from '../../common/dto/index';
import { StaffDetailResponseDto, StaffListResponseDto } from './dto/staff-list-response.dto';
import { SearchStaffDto } from './dto/search-staff.dto';
import { EmergencyContactDto } from './dto/create-staff.dto';
import { Staff, StaffSchema } from './schema/staff.schema';
import { MongoDbUtils } from '../../common/utils/mongodb.utils';

@Injectable()
export class StaffService extends BaseService<Staff> {
  constructor() {
    super('Staff', StaffSchema);
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
          userId: MongoDbUtils.toObjectIdOrNull(createDto.userId.toString())
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
  }

  async findById(
    connection: Connection,
    id: string
  ): Promise<Staff> {
    MongoDbUtils.validateId(id, 'staff');
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
    MongoDbUtils.validateId(id, 'staff');
    const repository = this.getRepository(connection);
    
    const updateData = {
      ...updateDto,
      ...(updateDto.userId && {
        userId: MongoDbUtils.toObjectIdOrNull(updateDto.userId.toString())
      })
    };

    await repository.findByIdAndUpdate(id, updateData);

    const updatedStaff = await repository.findById(id);

    if (!updatedStaff) {
      throw new NotFoundException('Staff member not found');
    }

    return StaffListResponseDto.fromEntity(updatedStaff);
  }

  async addEducationHistory(
    connection: Connection,
    staffId: string,
    education: EducationHistoryDto
  ): Promise<StaffListResponseDto> {
    return this.updateStaffArray(
      connection, 
      staffId, 
      'educationHistory', 
      education
    );
  }

  async addExperience(
    connection: Connection,
    staffId: string,
    experience: ExperienceDto
  ): Promise<StaffListResponseDto> {
    return this.updateStaffArray(
      connection, 
      staffId, 
      'experience', 
      experience
    );
  }

  async addDocument(
    connection: Connection,
    staffId: string,
    document: DocumentDto
  ): Promise<StaffListResponseDto> {
    return this.updateStaffArray(
      connection, 
      staffId, 
      'documents', 
      { ...document, uploadDate: new Date() }
    );
  }

  async updateEmergencyContact(
    connection: Connection,
    staffId: string,
    emergencyContact: EmergencyContactDto
  ): Promise<StaffListResponseDto> {
    MongoDbUtils.validateId(staffId, 'staff');
    const repository = this.getRepository(connection);
    
    const staff = await repository.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await repository.findByIdAndUpdate(staffId, { emergencyContact });

    const updatedStaff = await repository.findById(staffId);
    return StaffListResponseDto.fromEntity(updatedStaff);
  }

  async updateStaffStatus(
    connection: Connection,
    staffId: string,
    employmentStatus: string
  ): Promise<StaffListResponseDto> {
    MongoDbUtils.validateId(staffId, 'staff');
    const repository = this.getRepository(connection);

    await repository.findByIdAndUpdate(staffId, { employmentStatus });

    const updatedStaff = await repository.findById(staffId);

    if (!updatedStaff) {
      throw new NotFoundException('Staff member not found');
    }

    return StaffListResponseDto.fromEntity(updatedStaff);
  }

  async deleteStaff(
    connection: Connection,
    staffId: string
  ): Promise<boolean> {
    MongoDbUtils.validateId(staffId, 'staff');
    const repository = this.getRepository(connection);
    
    const result = await repository.delete(staffId);
    if (!result) {
      throw new NotFoundException('Staff member not found');
    }

    return true;
  }

  // Private helper method to handle updating array fields
  private async updateStaffArray<T>(
    connection: Connection,
    staffId: string,
    fieldName: string,
    item: T
  ): Promise<StaffListResponseDto> {
    MongoDbUtils.validateId(staffId, 'staff');
    const repository = this.getRepository(connection);
    
    const staff = await repository.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const currentArray = staff[fieldName] || [];
    currentArray.push(item);

    await repository.findByIdAndUpdate(staffId, { [fieldName]: currentArray });

    const updatedStaff = await repository.findById(staffId);
    return StaffListResponseDto.fromEntity(updatedStaff);
  }
}
