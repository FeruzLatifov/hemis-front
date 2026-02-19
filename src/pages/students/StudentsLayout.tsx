/**
 * Students Section Layout
 *
 * Simple wrapper for /students/* pages.
 * Sub-navigation is handled by the sidebar menu.
 */

import { Outlet } from 'react-router-dom'

export default function StudentsLayout() {
  return <Outlet />
}
