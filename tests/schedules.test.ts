import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createSchedule, deleteSchedule } from '@/actions/schedules'
import { mockDb } from './setup'
import { getSession } from '@/lib/auth'

describe('Schedules Server Actions Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock session as Admin
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@eduweb.test',
      name: 'Admin User',
      role: 'ADMIN',
    } as any)
    // Default mock room exists
    mockDb.room.findFirst.mockResolvedValue({ id: 'room-1', name: 'A101' })
    // Default no overlaps
    mockDb.schedule.findMany.mockResolvedValue([])
    // Default homework submissions count is 0
    mockDb.homeworkSubmission.count.mockResolvedValue(0)
  })

  // Test 2A-1: Validate ngày bắt đầu khớp thứ
  test('2A-1: Should fail validation if startDate day of week does not match selected dayOfWeek', async () => {
    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3, // Wednesday
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: '2025-07-07', // Monday
      recurrence: 'NONE',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Ngày bắt đầu không khớp với thứ đã chọn')
  })

  // Test 2A-2: Tạo chuỗi lặp hàng tuần
  test('2A-2: Should create weekly recurring schedule records with recurrenceGroupId', async () => {
    let createdRecords: any[] = []
    mockDb.schedule.create.mockImplementation((args) => {
      createdRecords.push(args.data)
      return Promise.resolve(args.data)
    })

    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3, // Wednesday
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: '2025-07-02', // Wednesday
      endDate: '2025-07-30', // Wednesday
      recurrence: 'WEEKLY',
    })

    expect(result.success).toBe(true)
    expect(createdRecords.length).toBe(5) // 02/07, 09/07, 16/07, 23/07, 30/07
    
    const recurrenceGroupId = createdRecords[0].recurrenceGroupId
    expect(recurrenceGroupId).toBeDefined()
    expect(recurrenceGroupId).not.toBeNull()
    
    // UUID format check (e.g. 8-4-4-4-12 hex chars)
    expect(recurrenceGroupId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    
    createdRecords.forEach(rec => {
      expect(rec.recurrenceGroupId).toBe(recurrenceGroupId)
      expect(rec.dayOfWeek).toBe(3)
      expect(rec.startTime).toBe('08:00')
      expect(rec.endTime).toBe('09:30')
      expect(rec.room).toBe('A101')
    })
  })

  // Test 2A-3: Overlap detection — trùng phòng
  test('2A-3: Should block schedule creation if room is already booked during same period', async () => {
    // Mock an overlapping schedule in room A101 from 08:30-10:00
    mockDb.schedule.findMany.mockResolvedValue([
      {
        id: 'existing-1',
        classId: 'class-2',
        subjectId: 'sub-2',
        teacherId: 'teacher-2',
        dayOfWeek: 3,
        startTime: '08:30',
        endTime: '10:00',
        room: 'A101',
        date: new Date('2025-07-09T00:00:00.000Z'),
        class: {
          name: 'Class 2',
          students: [],
        },
        subject: { name: 'Math' },
        teacher: { user: { name: 'Teacher 2' } },
      },
    ])

    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: '2025-07-09',
      recurrence: 'NONE',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Trùng phòng học')
  })

  // Test 2A-4: Overlap detection — trùng giáo viên
  test('2A-4: Should block schedule creation if teacher is already booked during same period', async () => {
    // Mock teacher-1 has schedule from 08:00-09:30 on same day
    mockDb.schedule.findMany.mockResolvedValue([
      {
        id: 'existing-2',
        classId: 'class-3',
        subjectId: 'sub-3',
        teacherId: 'teacher-1',
        dayOfWeek: 3,
        startTime: '08:00',
        endTime: '09:30',
        room: 'A102',
        date: new Date('2025-07-09T00:00:00.000Z'),
        class: {
          name: 'Class 3',
          students: [],
        },
        subject: { name: 'Physics' },
        teacher: { user: { name: 'Teacher 1' } },
      },
    ])

    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:30',
      room: 'A101',
      startDate: '2025-07-09',
      recurrence: 'NONE',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Trùng lịch giảng viên')
  })

  // Test 2A-5: Xóa ALL_FUTURE
  test('2A-5: Should delete only matching future schedule records in the recurrence group', async () => {
    mockDb.schedule.findUnique.mockResolvedValue({
      id: 'sch-16',
      recurrenceGroupId: 'group-xyz',
      date: new Date('2025-07-16T00:00:00.000Z'),
    })

    const result = await deleteSchedule('sch-16', 'ALL_FUTURE')

    expect(result.success).toBe(true)
    expect(mockDb.schedule.deleteMany).toHaveBeenCalledWith({
      where: {
        recurrenceGroupId: 'group-xyz',
        date: {
          gte: expect.any(Date),
        },
      },
    })
  })

  // Test 2A-6: Guard bảo vệ khi đã có HomeworkSubmission
  test('2A-6: Should block deletion of schedule if homework submissions already exist', async () => {
    mockDb.schedule.findUnique.mockResolvedValue({
      id: 'sch-target',
      recurrenceGroupId: 'group-xyz',
      date: new Date('2025-07-16T00:00:00.000Z'),
    })
    
    // Simulate homework submissions count is > 0
    mockDb.homeworkSubmission.count.mockResolvedValue(1)

    const result = await deleteSchedule('sch-target', 'ONLY_THIS')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Không thể xóa: Học viên đã nộp bài tập')
  })
})
