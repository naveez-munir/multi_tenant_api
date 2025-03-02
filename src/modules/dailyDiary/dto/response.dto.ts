export class DailyDiaryResponseDto {
  id: string;
  createdBy: string;
  date: string;
  title: string;
  description: string;
  classId : Class;
  subjectTasks: SubjectTaskResponse[];
  attachments: AttachmentResponse[];

  static fromEntity(dairy: any): DailyDiaryResponseDto {
    return {
      id: dairy._id.toString(),
      createdBy: dairy.createdBy,
      date: dairy.date,
      title: dairy.title,
      description: dairy.description,
      classId : {
        classGradeLevel : dairy.classId.classGradeLevel,
        className : dairy.classId.className,
        classSection: dairy.classId.classSection,
        id: dairy.classId._id.toString(),
      },
      subjectTasks: dairy.subjectTasks.map((task: any) => ({
        id: task._id.toString(),
        subject: {
          id: task.subject._id.toString(),
          subjectName: task.subject.subjectName,
          subjectCode: task.subject.subjectCode
        },
        task: task.task,
        dueDate: task.dueDate,
        additionalNotes: task.additionalNotes
      })),
      attachments: dairy.attachments.map((attachment: any) => ({
        id: attachment._id?.toString() || '',
        title: attachment.title || '',
        fileUrl: attachment.fileUrl || '',
        fileType: attachment.fileType || ''
      }))

    };
  }
}

export interface Class {
  classGradeLevel : string,
  className : string,
  classSection: string,
  id: string
}

export interface SubjectTaskResponse {
  id: string;
  subject: SubjectResponse;
  task: string;
  dueDate?: string;
  additionalNotes?: string;
}
 export interface SubjectResponse {
  id: string;
  subjectName: string;
  subjectCode: string;
}
export interface AttachmentResponse {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
}
