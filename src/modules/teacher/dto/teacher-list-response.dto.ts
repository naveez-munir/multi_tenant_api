export class TeacherListResponseDto {
  id: string;
  name: string;
  cniNumber: string;
  email?: string;
  phone?: string;
  gender: string;
  employmentStatus: string;
  photoUrl?: string;
  assignedClassName?: string;
  qualifications: string[];
  subjects?: string[];
  joiningDate: Date;

  static fromEntity(teacher: any): TeacherListResponseDto {
    return {
      id: teacher._id.toString(),
      name: `${teacher.firstName} ${teacher.lastName}`,
      cniNumber: teacher.cniNumber,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      employmentStatus: teacher.employmentStatus,
      photoUrl: teacher.photoUrl,
      assignedClassName: teacher.classTeacherOf?.className || '',
      qualifications: teacher.qualifications || [],
      subjects: teacher.subjects || [],
      joiningDate: teacher.joiningDate
    };
  }
}
