export interface CreateAttendanceResponseDto {
  success: boolean;
  message: string;
  id: string;
}

export interface BatchCreateResponseDto {
  success: boolean;
  message: string;
  count: number;
  ids: string[];
}

export interface AttendanceResponseDto {
  id: string;
  user: {
    id: string;
    name: string;
    rollNumber?: string;
    employeeId?: string;
    type: string;
  };
  class?: {
    id: string;
    className: string;
    section: string;
  };
  date: string;
  status: string;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassAttendanceReportDto {
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    presentPercentage: number;
  };
  class: {
    id: string;
    className: string;
    section: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  records: AttendanceResponseDto[];
}

export interface UserAttendanceReportDto {
  user: {
    id: string;
    name: string;
    rollNumber?: string;
    employeeId?: string;
    type: string;
  };
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  records: AttendanceResponseDto[];
}

export interface MonthlyAttendanceReportDto {
  month: number;
  year: number;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    averageAttendance: number;
  };
  dailyReport: {
    [key: number]: {
      present: number;
      absent: number;
      late: number;
      total: number;
    };
  };
  filter: {
    userType?: string;
    class?: {
      id: string;
      className: string;
      section: string;
    };
  };
}

