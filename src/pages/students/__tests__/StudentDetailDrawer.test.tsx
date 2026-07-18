import { describe, it, expect, vi } from 'vitest'
import { renderWithoutRouter as render, screen } from '@/test/test-utils'
import StudentDetailDrawer from '../StudentDetailDrawer'
import type { StudentRow } from '@/api/students.api'

const student: StudentRow = {
  id: '1',
  code: 'S-001',
  fullName: 'Ali Valiev',
  firstname: 'Ali',
  lastname: 'Valiev',
  fathername: 'Aliyevich',
  pinfl: '12345678901234',
  university: 'Test University',
  faculty: 'IT Faculty',
  speciality: 'Software Engineering',
  studentStatus: 'active',
  paymentForm: 'grant',
  educationType: 'bachelor',
  educationForm: 'fulltime',
  course: '2',
  educationYear: '2024-2025',
  gender: 'male',
  groupName: 'IF-101',
  active: true,
}

// echo the code back so field values are deterministic
const resolveName = (_dict: string, code: string) => code

describe('StudentDetailDrawer', () => {
  it('renders the student name, code and key fields', () => {
    render(<StudentDetailDrawer student={student} resolveName={resolveName} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Ali Valiev')).toBeInTheDocument()
    expect(screen.getByText('12345678901234')).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
    expect(screen.getByText('IF-101')).toBeInTheDocument()
  })

  it('resolves coded fields through the provided resolver', () => {
    const resolver = vi.fn((_dict: string, code: string) => `name:${code}`)
    render(<StudentDetailDrawer student={student} resolveName={resolver} onClose={vi.fn()} />)

    expect(resolver).toHaveBeenCalledWith('studentStatuses', 'active')
    expect(screen.getByText('name:active')).toBeInTheDocument()
  })
})
