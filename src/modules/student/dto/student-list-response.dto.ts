export class StudentListResponseDto {
  id: string;
  name: string;
  gradeLevel: string;
  className?: string;
  guardianName: string;
  photoUrl?: string;
  status: string;
  rollNumber?: string;

  static fromEntity(student: any): StudentListResponseDto {
    return {
      id: student._id.toString(),
      name: `${student.firstName} ${student.lastName}`,
      gradeLevel: student.gradeLevel,
      className: student.class?.className || '',
      guardianName: student.guardian?.name || '',
      photoUrl: student.photoUrl || '',
      status: student.status || 'Active',
      rollNumber: student.rollNumber || ''
    };
  }
}
