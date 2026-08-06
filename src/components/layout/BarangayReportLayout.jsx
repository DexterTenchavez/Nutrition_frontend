import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BarangayReportSidebar from './BarangayReportSidebar'
import './css/BarangayReportLayout.css'

const BarangayReportLayout = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="barangay-report-layout">
      <div className="layout-body">
        {/* Desktop sidebar */}
        <aside className={`sidebar-wrapper ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar">
            <BarangayReportSidebar 
              collapsed={collapsed} 
              onToggleCollapse={() => setCollapsed(!collapsed)} 
            />
          </div>
        </aside>

        <main className="content-wrapper">
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default BarangayReportLayout