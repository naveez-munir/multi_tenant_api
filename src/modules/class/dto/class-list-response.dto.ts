export class ClassListResponseDto {
  id: string;
  className: string;
  classSection: string;
  classGradeLevel: string;
  teacherName?: string;
  tempTeacherName?: string;
  subjectCount: number;

  static fromEntity(classData: any): ClassListResponseDto {
    return {
      id: classData._id.toString(),
      className: classData.className,
      classSection: classData.classSection || '',
      classGradeLevel: classData.classGradeLevel || '',
      teacherName: `${classData.classTeacher?.firstName || ''} ${classData.classTeacher?.lastName || ''}` || '',
      tempTeacherName: `${classData.classTempTeacher?.firstName || ''} ${classData.classTempTeacher?.lastName || ''}` || '',
      subjectCount: classData.classSubjects?.length || 0
    };
  }
}
