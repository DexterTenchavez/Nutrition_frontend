import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar as BsNavbar, Nav, Container, Button, Badge } from 'react-bootstrap'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <BsNavbar bg="primary" variant="dark" expand="lg" className="shadow">
      <Container>
        <BsNavbar.Brand as={Link} to="/dashboard">
          🏥 Nutrition Management
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/reports">Reports</Nav.Link>
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/overall-report">Overall Report</Nav.Link>
                <Nav.Link as={Link} to="/admin/staff">Staff Management</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            <span className="navbar-text text-white me-3">
              <Badge bg="light" text="dark" className="me-2">
                {user.role}
              </Badge>
              {user.username}
            </span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}

export default Navbar