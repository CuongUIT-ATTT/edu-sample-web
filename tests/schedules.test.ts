import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createSchedule, deleteSchedule, updateSchedule } from '@/actions/schedules'
import { mockDb } from './setup'
import { getSession } from '@/lib/auth'
import { normalizeDateUtc } from '@/lib/schedule-expand'

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
    // Default room exists
    mockDb.room.findFirst.mockResolvedValue({ id: 'room-1', name: 'A101' })
    // Default: no other series on that weekday → conflict check returns empty
    mockDb.scheduleSeries.findMany.mockResolvedValue([])
    // Default homework submissions count is 0
    mockDb.homeworkSubmission.count.mockResolvedValue(0)
    // Default create returns a series
    mockDb.scheduleSeries.create.mockImplementation((args: any) => Promise.resolve({ id: 'series-new', ...args.data }))
    // Default upsert resolves
    mockDb.scheduleException.upsert.mockResolvedValue({ id: 'exc-1' })
    mockDb.scheduleException.deleteMany.mockResolvedValue({ count: 0 })
    mockDb.scheduleSeries.update.mockResolvedValue({ id: 'series-1' })
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
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Ngày bắt đầu không khớp với thứ đã chọn')
  })

  // Test 2A-2: Tạo series mới (không nở vật lý — chỉ 1 ScheduleSeries)
  test('2A-2: Should create a single ScheduleSeries (no physical occurrence rows)', async () => {
    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3, // Wednesday
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: '2025-07-02', // Wednesday
      endDate: '2025-07-30',
    })

    expect(result.success).toBe(true)
    // Đúng 1 series tạo, không phải 5 row
    expect(mockDb.scheduleSeries.create).toHaveBeenCalledTimes(1)
    const createArg = (mockDb.scheduleSeries.create as any).mock.calls[0][0]
    expect(createArg.data.dayOfWeek).toBe(3)
    expect(createArg.data.startTime).toBe('08:00')
    expect(createArg.data.endTime).toBe('09:30')
    expect(createArg.data.room).toBe('A101')
    // startDate/endDate được normalize về UTC midnight
    expect(createArg.data.startDate.getUTCDate()).toBe(2)
  })

  // Test 2A-3: Overlap detection — trùng phòng
  test('2A-3: Should block schedule creation if room is already booked during same period', async () => {
    // Mock 1 series khác cùng thứ, trùng giờ, cùng phòng → expand ra instance trùng
    const existingSeries = {
      id: 'existing-series-1',
      classId: 'class-2',
      subjectId: 'sub-2',
      teacherId: 'teacher-2',
      dayOfWeek: 3,
      startTime: '08:30',
      endTime: '10:00',
      room: 'A101',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
      materials: null,
      homework: null,
      homeworkDueDate: null,
      homeworkQuizId: null,
      class: { name: 'Class 2', students: [] },
      subject: { name: 'Math' },
      teacher: { user: { name: 'Teacher 2' } },
      exceptions: [],
    }
    mockDb.scheduleSeries.findMany.mockResolvedValue([existingSeries])

    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: '2025-07-09',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Trùng phòng học')
  })

  // Test 2A-4: Overlap detection — trùng giáo viên
  test('2A-4: Should block schedule creation if teacher is already booked during same period', async () => {
    const existingSeries = {
      id: 'existing-series-2',
      classId: 'class-3',
      subjectId: 'sub-3',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '09:30',
      room: 'A102',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
      materials: null,
      homework: null,
      homeworkDueDate: null,
      homeworkQuizId: null,
      class: { name: 'Class 3', students: [] },
      subject: { name: 'Physics' },
      teacher: { user: { name: 'Teacher 1' } },
      exceptions: [],
    }
    mockDb.scheduleSeries.findMany.mockResolvedValue([existingSeries])

    const result = await createSchedule({
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:30',
      room: 'A101',
      startDate: '2025-07-09',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Trùng lịch giảng viên')
  })

  // Test 2A-5: Xóa ALL_FUTURE — cắt endDate series, không xóa series
  test('2A-5: ALL_FUTURE deletes by cutting endDate, not deleting the series', async () => {
    mockDb.scheduleSeries.findUnique.mockResolvedValue({
      id: 'series-1',
      teacherId: 'teacher-1',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
    })

    const result = await deleteSchedule({
      seriesId: 'series-1',
      instanceDate: '2025-07-16',
      deleteMode: 'ALL_FUTURE',
    })

    expect(result.success).toBe(true)
    // Update endDate = ngày trước 16/07
    expect(mockDb.scheduleSeries.update).toHaveBeenCalled()
    const updateArg = (mockDb.scheduleSeries.update as any).mock.calls[0][0]
    expect(updateArg.data.endDate.getUTCDate()).toBe(15)
    // Không xóa series gốc
    expect(mockDb.scheduleSeries.delete).not.toHaveBeenCalled()
    // Xóa exception >= ngày xóa
    expect(mockDb.scheduleException.deleteMany).toHaveBeenCalled()
  })

  // Test 2A-6: Guard bảo vệ khi đã có HomeworkSubmission
  test('2A-6: Should block deletion if homework submissions already exist', async () => {
    mockDb.scheduleSeries.findUnique.mockResolvedValue({
      id: 'series-1',
      teacherId: 'teacher-1',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
    })

    // Simulate homework submissions count is > 0
    mockDb.homeworkSubmission.count.mockResolvedValue(1)

    const result = await deleteSchedule({
      seriesId: 'series-1',
      instanceDate: '2025-07-16',
      deleteMode: 'ONLY_THIS',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Không thể xóa: Học viên đã nộp bài tập')
  })

  // Test 2A-7: ONLY_THIS tạo exception CANCELLED (không xóa series)
  test('2A-7: ONLY_THIS creates a CANCELLED exception instead of deleting', async () => {
    mockDb.scheduleSeries.findUnique.mockResolvedValue({
      id: 'series-1',
      teacherId: 'teacher-1',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
    })

    const result = await deleteSchedule({
      seriesId: 'series-1',
      instanceDate: '2025-07-16',
      deleteMode: 'ONLY_THIS',
    })

    expect(result.success).toBe(true)
    expect(mockDb.scheduleException.upsert).toHaveBeenCalled()
    const upsertArg = (mockDb.scheduleException.upsert as any).mock.calls[0][0]
    expect(upsertArg.create.status).toBe('CANCELLED')
    expect(mockDb.scheduleSeries.delete).not.toHaveBeenCalled()
  })

  // Test 2A-8: updateSchedule ONLY_THIS tạo exception MODIFIED
  test('2A-8: updateSchedule ONLY_THIS creates a MODIFIED exception', async () => {
    mockDb.scheduleSeries.findUnique.mockResolvedValue({
      id: 'series-1',
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '09:30',
      room: 'A101',
      startDate: normalizeDateUtc('2025-07-01'),
      endDate: null,
      class: { name: 'Class 1', students: [] },
      subject: { name: 'Math' },
      teacher: { user: { name: 'Teacher 1' } },
      exceptions: [],
    })
    mockDb.scheduleSeries.findMany.mockResolvedValue([])

    const result = await updateSchedule({
      seriesId: 'series-1',
      instanceDate: '2025-07-16',
      classId: 'class-1',
      subjectId: 'subject-1',
      teacherId: 'teacher-1',
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:30',
      room: 'A101',
      updateMode: 'ONLY_THIS',
    })

    expect(result.success).toBe(true)
    expect(mockDb.scheduleException.upsert).toHaveBeenCalled()
    const upsertArg = (mockDb.scheduleException.upsert as any).mock.calls[0][0]
    expect(upsertArg.create.status).toBe('MODIFIED')
    expect(upsertArg.create.startTime).toBe('09:00')
  })
})
