import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Nav, Offcanvas, Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { List, ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import './StaffLayout.css'

const StaffLayout = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { path: '/staff/child-records', label: 'Child Records', icon: '👶' },
    { path: '/staff/animal-raising', label: 'Animal Raising', icon: '🐄' },
    { path: '/staff/potable-water', label: 'Potable Water', icon: '💧' },
    { path: '/staff/iodized-salt', label: 'Iodized Salt', icon: '🧂' },
    { path: '/staff/cr', label: 'With/Without CR', icon: '🚽' },
    { path: '/staff/backyard-gardening', label: 'Backyard Gardening', icon: '🌱' },
    { path: '/staff/pregnant-women', label: 'Pregnant Women', icon: '🤰' },
    { path: '/staff/vegetable-seeds', label: 'Vegetable Seeds', icon: '🌿' },
    { path: '/staff/animal-dispersal', label: 'Animal Dispersal', icon: '🐔' },
  ]

  const NavItem = ({ item, onNavigate, isCollapsed }) => {
    const link = (
      <Nav.Link
        as={Link}
        to={item.path}
        className={location.pathname === item.path ? 'active' : ''}
        onClick={onNavigate}
      >
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
      </Nav.Link>
    )

    if (!isCollapsed) return link

    return (
      <OverlayTrigger key={item.path} placement="right" overlay={<Tooltip>{item.label}</Tooltip>}>
        {link}
      </OverlayTrigger>
    )
  }

  const SidebarContent = ({ onNavigate, isCollapsed = false }) => (
    <>
      <div className="sidebar-header">
        <h5 className="mb-0">{isCollapsed ? 'DE' : 'Data Entry'}</h5>
      </div>
      <Nav className="flex-column sidebar-nav">
        {menuItems.map((item) => (
          <NavItem key={item.path} item={item} onNavigate={onNavigate} isCollapsed={isCollapsed} />
        ))}
      </Nav>
    </>
  )

  return (
    <div className="staff-layout">
      {/* Mobile toggle bar */}
      <div className="mobile-sidebar-toggle d-md-none">
        <Button variant="light" onClick={() => setShowSidebar(true)} className="sidebar-toggle-btn">
          <List size={18} />
          <span>Menu</span>
        </Button>
      </div>

      <div className="layout-body">
        {/* Desktop sidebar */}
        <aside className={`sidebar-wrapper d-none d-md-flex ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar">
            <button
              type="button"
              className="collapse-toggle-btn"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <SidebarContent isCollapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile offcanvas sidebar */}
        <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        className="d-md-none sidebar-offcanvas"
        responsive="md"
        style={{ width: '260px' }}
        >
          <Offcanvas.Header closeButton/>
          <Offcanvas.Body className="p-0">
            <div className="sidebar">
              <SidebarContent onNavigate={() => setShowSidebar(false)} />
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        <main className="content-wrapper">
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default StaffLayout