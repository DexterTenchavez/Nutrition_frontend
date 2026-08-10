// components/layout/OverallReportLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import OverallReportSidebar from './OverallReportSidebar'
import './css/ReportLayout.css'

const OverallReportLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="report-layout">
      <div className={`report-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <OverallReportSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />
      </div>
      <div className={`report-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Outlet />
      </div>
    </div>
  )
}

export default OverallReportLayout