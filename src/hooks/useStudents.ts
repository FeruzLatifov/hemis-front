import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'
import {
  studentsApi,
  type StudentsParams,
  type DuplicatesParams,
  type DirectionsParams,
} from '@/api/students.api'
import type { StudentDictionaries } from '@/api/students.api'

export function useStudents(params: StudentsParams = {}) {
  return useQuery({
    queryKey: queryKeys.students.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => studentsApi.getStudents(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.students.byId(id),
    queryFn: ({ signal }) => studentsApi.getStudent(id, signal),
    enabled: !!id,
  })
}

export function useStudentStats(university?: string) {
  return useQuery({
    queryKey: queryKeys.students.stats(university),
    queryFn: ({ signal }) => studentsApi.getStats(university, signal),
  })
}

export function useStudentDictionaries() {
  return useQuery<StudentDictionaries>({
    queryKey: queryKeys.students.dictionaries,
    queryFn: ({ signal }) => studentsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

export function useDuplicateStats(university?: string) {
  return useQuery({
    queryKey: queryKeys.students.duplicateStats(university),
    queryFn: ({ signal }) => studentsApi.getDuplicateStats(university, signal),
  })
}

export function useDuplicates(params: DuplicatesParams = {}) {
  return useQuery({
    queryKey: queryKeys.students.duplicates(params as Record<string, unknown>),
    queryFn: ({ signal }) => studentsApi.getDuplicates(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useDuplicateGroupDetail(pinfl: string | null) {
  return useQuery({
    queryKey: queryKeys.students.duplicateGroupDetail(pinfl || ''),
    queryFn: ({ signal }) => studentsApi.getDuplicateGroupDetail(pinfl!, signal),
    enabled: !!pinfl,
  })
}

export function useSpecialityStats(params: DirectionsParams = {}) {
  return useQuery({
    queryKey: queryKeys.students.directions(params as Record<string, unknown>),
    queryFn: ({ signal }) => studentsApi.getDirections(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useSpecialitySummary() {
  return useQuery({
    queryKey: queryKeys.students.directionsSummary,
    queryFn: ({ signal }) => studentsApi.getDirectionsSummary(signal),
    staleTime: CACHE.MEDIUM,
  })
}
