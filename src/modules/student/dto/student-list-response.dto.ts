export class StudentListResponseDto {
  id: string;
  name: string;
  gradeLevel: string;
  classId?: string;
  className?: string;
  guardianName: string;
  photoUrl?: string;
  cnic?: string;
  status: string;
  rollNumber?: string;

  static fromEntity(student: any): StudentListResponseDto {
    return {
      id: student._id.toString(),
      name: `${student.firstName} ${student.lastName}`,
      gradeLevel: student.gradeLevel,
      classId: student.class?._id.toString() || '',
      className: student.class?.className || '',
      guardianName: student.guardian?.name || '',
      photoUrl: student.photoUrl || '',
      cnic: student.cniNumber,
      status: student.status || 'Active',
      rollNumber: student.rollNumber || ''
    };
  }
}
