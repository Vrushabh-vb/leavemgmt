export interface Holiday {
  date: string
  day: string
  type: "Compulsory" | "Additional" | "Declared"
  name: string
  weekend: boolean
}

export interface RestrictedHoliday {
  date: string
  day: string
  name: string
}

export interface LeaveRequest {
  id: string
  type: "PL" | "CL" | "RH"
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: "Pending" | "Approved" | "Rejected"
  requestDate: string
}

export interface LeaveBalance {
  pl: number
  cl: number
  rh: number
}
