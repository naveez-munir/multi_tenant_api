export class ExamResultResponseDto {
  id: string;
  exam: {
    id: string;
    type: string;
    academicYear: string;
  };
  student: {
    id: string;
    name: string;
    rollNumber: string;
  };
  subjectResults: {
    subject: {
      id: string;
      name: string;
    };
    marksObtained: number;
    maxMarks: number;
    percentage: string;
    remarks?: string;
  }[];
  totalMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  remarks?: string;

  static fromEntity(result: any): ExamResultResponseDto {
    return {
      id: result._id.toString(),
      exam: {
        id: result.examId._id.toString(),
        type: result.examId.examType?.name || '',
        academicYear: result.examId.academicYear
      },
      student: {
        id: result.studentId._id.toString(),
        name: result.studentId.name,
        rollNumber: result.studentId.rollNumber
      },
      subjectResults: result.subjectResults.map(sr => ({
        subject: {
          id: sr.subject._id.toString(),
          name: sr.subject.subjectName
        },
        marksObtained: sr.marksObtained,
        maxMarks: sr.maxMarks,
        percentage: ((sr.marksObtained / sr.maxMarks) * 100).toFixed(2),
        remarks: sr.remarks
      })),
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      rank: result.rank,
      remarks: result.remarks
    };
  }
}
