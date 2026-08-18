import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap'
import nutritionLogo from '../../assets/nutritionlogo.jpg'
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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path)

  return (
    <BsNavbar expand="lg" sticky="top" className="app-navbar shadow-sm" variant="dark">
      <Container>
        <BsNavbar.Brand as={Link} to="/dashboard" className="brand-mark">
          <span className="brand-icon">
            <img src={nutritionLogo} alt="Nutrition Logo" />
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
            <Nav.Link as={Link} to="/barangay-report" className={isActive('/barangay-report') ? 'active' : ''}>
                  Barangay Report
                </Nav.Link>
            {!isAdmin && (
              <Nav.Link as={Link} to="/staff/child-records" className={location.pathname.startsWith('/staff') ? 'active' : ''}>
                Data Entry
              </Nav.Link>
            )}
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/overall-report" className={isActive('/overall-report') ? 'active' : ''}>
                  Overall Report
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/records" className={isActive('/admin/records') ? 'active' : ''}>
                  All Records
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