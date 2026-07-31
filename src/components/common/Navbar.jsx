import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const isActive = (path) => location.pathname === path

  return (
    <BsNavbar expand="lg" className="app-navbar shadow-sm" variant="dark">
      <Container>
        <BsNavbar.Brand as={Link} to="/dashboard" className="brand-mark">
          <span className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 8.5 12 2 12 2Z" fill="#0B4F4A"/>
              <path d="M12 20C12 20 12 16 12 13" stroke="#F5F1E8" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span>
            Nutrition Management
            <span className="brand-sub">Municipal Nutrition Council</span>
          </span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              Dashboard
            </Nav.Link>
            {!isAdmin && (
              <Nav.Link as={Link} to="/data-entry" className={isActive('/data-entry') ? 'active' : ''}>
                Data Entry
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/barangay-report" className={isActive('/barangay-report') ? 'active' : ''}>
              Barangay Report
            </Nav.Link>
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/overall-report" className={isActive('/overall-report') ? 'active' : ''}>
                  Overall Report
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/staff" className={isActive('/admin/staff') ? 'active' : ''}>
                  Staff Management
                </Nav.Link>
              </>
            )}
          </Nav>

          <div className="user-chip mt-3 mt-lg-0">
            <span className={`badge role-badge ${isAdmin ? 'role-admin' : 'role-staff'}`}>
              {user.role}
            </span>
            <span className="username-text">{user.username}</span>
            <Button variant="outline-light" size="sm" className="logout-btn" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}

export default Navbar