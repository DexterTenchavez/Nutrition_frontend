import { Outlet } from 'react-router-dom'
import { StaffDataEntryProvider } from '../staff/StaffDataEntryContext'
import './css/StaffLayout.css'

const StaffLayout = () => {
  return (
    <StaffDataEntryProvider>
      <div className="staff-layout">
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </StaffDataEntryProvider>
  )
}

export default StaffLayout