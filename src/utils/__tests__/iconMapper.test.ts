import { getIcon } from '../iconMapper'
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  Building,
  Users,
  Settings,
  Languages,
  Database,
  FolderOpen,
  Building2,
  Send,
  Trophy,
  TestTube,
  HelpCircle,
} from 'lucide-react'

describe('getIcon', () => {
  describe('lowercase icon names', () => {
    it('maps "home" to Home', () => {
      expect(getIcon('home')).toBe(Home)
    })

    it('maps "layout-dashboard" to LayoutDashboard', () => {
      expect(getIcon('layout-dashboard')).toBe(LayoutDashboard)
    })

    it('maps "graduation-cap" to GraduationCap', () => {
      expect(getIcon('graduation-cap')).toBe(GraduationCap)
    })

    it('maps "building" to Building', () => {
      expect(getIcon('building')).toBe(Building)
    })

    it('maps "users" to Users', () => {
      expect(getIcon('users')).toBe(Users)
    })

    it('maps "settings" to Settings', () => {
      expect(getIcon('settings')).toBe(Settings)
    })

    it('maps "languages" to Languages', () => {
      expect(getIcon('languages')).toBe(Languages)
    })

    it('maps "database" to Database', () => {
      expect(getIcon('database')).toBe(Database)
    })
  })

  describe('CUBA legacy icon names (SCREAMING_SNAKE_CASE)', () => {
    it('maps "HOME" to Home', () => {
      expect(getIcon('HOME')).toBe(Home)
    })

    it('maps "DASHBOARD" to LayoutDashboard', () => {
      expect(getIcon('DASHBOARD')).toBe(LayoutDashboard)
    })

    it('maps "GRADUATION_CAP" to GraduationCap', () => {
      expect(getIcon('GRADUATION_CAP')).toBe(GraduationCap)
    })

    it('maps "BUILDING" to Building', () => {
      expect(getIcon('BUILDING')).toBe(Building)
    })

    it('maps "GEAR" to Settings', () => {
      expect(getIcon('GEAR')).toBe(Settings)
    })

    it('maps "PAPER_PLANE" to Send', () => {
      expect(getIcon('PAPER_PLANE')).toBe(Send)
    })

    it('maps "SOCCER_BALL_O" to Trophy', () => {
      expect(getIcon('SOCCER_BALL_O')).toBe(Trophy)
    })

    it('maps "FLASK" to TestTube', () => {
      expect(getIcon('FLASK')).toBe(TestTube)
    })
  })

  describe('semantic names', () => {
    it('maps "Dashboard" to LayoutDashboard', () => {
      expect(getIcon('Dashboard')).toBe(LayoutDashboard)
    })

    it('maps "University" to Building2', () => {
      expect(getIcon('University')).toBe(Building2)
    })

    it('maps "Student" to GraduationCap', () => {
      expect(getIcon('Student')).toBe(GraduationCap)
    })

    it('maps "Help" to HelpCircle', () => {
      expect(getIcon('Help')).toBe(HelpCircle)
    })
  })

  describe('fallback behavior', () => {
    it('returns FolderOpen for undefined', () => {
      expect(getIcon(undefined)).toBe(FolderOpen)
    })

    it('returns FolderOpen for empty string', () => {
      expect(getIcon('')).toBe(FolderOpen)
    })

    it('returns FolderOpen for unknown name', () => {
      expect(getIcon('totally-unknown-icon')).toBe(FolderOpen)
    })
  })

  describe('capitalization fallback', () => {
    it('maps "dashboard" via capitalization to Dashboard → LayoutDashboard', () => {
      expect(getIcon('dashboard')).toBe(LayoutDashboard)
    })

    it('maps "student" via capitalization to Student → GraduationCap', () => {
      expect(getIcon('student')).toBe(GraduationCap)
    })
  })
})
