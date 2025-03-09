import { Staff } from '../schema/staff.schema';

export class StaffListResponseDto {
  id: string;
  name: string;
  cniNumber: string;
  email?: string;
  phone?: string;
  gender: string;
  employmentStatus: string;
  photoUrl?: string;
  designation: string;
  department?: string;
  qualifications: string[];
  joiningDate: Date;

  static fromEntity(staff: any): StaffListResponseDto {
    return {
      id: staff._id.toString(),
      name: `${staff.firstName} ${staff.lastName}`,
      cniNumber: staff.cniNumber,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender,
      employmentStatus: staff.employmentStatus,
      photoUrl: staff.photoUrl,
      designation: staff.designation,
      department: staff.department || '',
      qualifications: staff.qualifications || [],
      joiningDate: staff.joiningDate
    };
  }
}

// staff-detail-response.dto.ts
export class StaffDetailResponseDto {
  id: string;
  cniNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  email?: string;
  bloodGroup?: string;
  photoUrl?: string;
  phone?: string;
  address?: string;
  joiningDate: Date;
  leavingDate?: Date;
  employmentStatus: string;
  designation: string;
  department?: string;
  qualifications?: string[];
  jobDescription?: string;
  reportingTo?: string;
  skills?: string[];
  responsibilities?: string[];
  emergencyContact?: Record<string, any>;
  educationHistory?: Record<string, any>[];
  experience?: Record<string, any>[];
  documents?: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Staff): StaffDetailResponseDto {
    const response = new StaffDetailResponseDto();
    response.id = entity._id.toString();
    response.cniNumber = entity.cniNumber;
    response.firstName = entity.firstName;
    response.lastName = entity.lastName;
    response.gender = entity.gender;
    response.email = entity.email;
    response.bloodGroup = entity.bloodGroup;
    response.photoUrl = entity.photoUrl;
    response.phone = entity.phone;
    response.address = entity.address;
    response.joiningDate = entity.joiningDate;
    response.leavingDate = entity.leavingDate;
    response.employmentStatus = entity.employmentStatus;
    response.designation = entity.designation;
    response.department = entity.department;
    response.qualifications = entity.qualifications;
    response.jobDescription = entity.jobDescription;
    response.reportingTo = entity.reportingTo;
    response.skills = entity.skills;
    response.responsibilities = entity.responsibilities;
    response.emergencyContact = entity.emergencyContact;
    response.educationHistory = entity.educationHistory;
    response.experience = entity.experience;
    response.documents = entity.documents;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    
    return response;
  }
}
