export class ExamTypeDto {
  id: string;
  name: string;
  weightAge: number;

  static fromEntity(examType: any): ExamTypeDto {
    if (!examType) return null;
    return {
      id: examType._id?.toString(),
      name: examType.name || '',
      weightAge: examType.weightAge || 0
    };
  }
}

export class ClassDto {
  id: string;
  className: string;
  classSection: string;

  static fromEntity(classData: any): ClassDto {
    if (!classData) return null;
    return {
      id: classData._id?.toString(),
      className: classData.className || '',
      classSection: classData.classSection || ''
    };
  }
}

export class SubjectDto {
  id: string;
  name: string;
  code: string;

  static fromEntity(subject: any): SubjectDto {
    if (!subject) return null;
    return {
      id: subject._id?.toString(),
      name: subject.subjectName || '',
      code: subject.subjectCode || ''
    };
  }
}

export class ExamSubjectDto {
  subject: SubjectDto;
  examDate: Date;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;

  static fromEntity(subjectData: any): ExamSubjectDto {
    if (!subjectData) return null;
    return {
      subject: SubjectDto.fromEntity(subjectData.subject),
      examDate: subjectData.examDate,
      startTime: subjectData.startTime || '',
      endTime: subjectData.endTime || '',
      maxMarks: subjectData.maxMarks || 0,
      passingMarks: subjectData.passingMarks || 0
    };
  }
}

export class ExamResponseDto {
  id: string;
  examType: ExamTypeDto;
  class: ClassDto;
  subjects: ExamSubjectDto[];
  academicYear: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  status: string;
  static fromEntity(exam: any): ExamResponseDto {
    if (!exam) return null;
    
    return {
      id: exam._id?.toString(),
      examType: ExamTypeDto.fromEntity(exam.examType),
      class: ClassDto.fromEntity(exam.classId),
      subjects: exam.subjects?.map(subject => ExamSubjectDto.fromEntity(subject)) || [],
      academicYear: exam.academicYear || '',
      startDate: exam.startDate,
      endDate: exam.endDate,
      description: exam.description || '',
      status: exam.status || 'Scheduled'
    };
  }

  static fromEntities(exams: any[]): ExamResponseDto[] {
    return exams?.map(exam => ExamResponseDto.fromEntity(exam)) || [];
  }
}
