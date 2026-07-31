import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { childRecordApi } from '../api/auth'
import { Card, Row, Col, Spinner, Button, Container } from 'react-bootstrap'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalBarangays: 0,
    totalChildren: 0,
    myRecords: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const records = await childRecordApi.getAll()
      const barangays = new Set(records.map(r => r.barangay))
      const myRecords = records.filter(r => r.recordedBy === user?.id).length

      setStats({
        totalRecords: records.length,
        totalBarangays: barangays.size,
        totalChildren: records.length,
        myRecords,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    )
  }

  // Header with Logo
  const DashboardHeader = ({ title, subtitle, role }) => (
    <div className="d-flex align-items-center gap-4 mb-4 p-3 bg-white rounded-3 shadow-sm">
      <img 
        src={nutritionLogo} 
        alt="Nutrition Logo" 
        style={{ 
          width: '70px', 
          height: '70px', 
          objectFit: 'cover',
          borderRadius: '50%',
          border: '3px solid #198754'
        }} 
      />
      <div>
        <h1 className="display-6 fw-bold text-success mb-0">{title}</h1>
        <p className="text-muted mb-0">{subtitle}</p>
        <span className="badge bg-success mt-1 px-3 py-1">{role}</span>
      </div>
    </div>
  )

  // Stat Card Component
  const StatCard = ({ title, value, color, icon }) => (
    <Card className="text-center border-0 shadow-sm h-100">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center py-4">
        <div className={`rounded-circle bg-${color}-subtle p-3 mb-2 d-flex align-items-center justify-content-center`}>
          <i className={`bi bi-${icon} text-${color}`} style={{ fontSize: '1.8rem' }}></i>
        </div>
        <h2 className="fw-bold mb-0">{value}</h2>
        <h6 className="text-muted mb-0">{title}</h6>
      </Card.Body>
    </Card>
  )

  if (isAdmin) {
    return (
      <Container fluid className="px-3 px-md-4">
        <DashboardHeader 
          title="Admin Dashboard" 
          
          role="Administrator"
        />

        <Row className="g-4 mb-4">
          <Col xs={12} sm={6} md={3}>
            <StatCard title="Total Records" value={stats.totalRecords} color="primary" icon="file-text" />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <StatCard title="Barangays" value={stats.totalBarangays} color="info" icon="map" />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <StatCard title="Total Children" value={stats.totalChildren} color="success" icon="people" />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <StatCard title="Staff Records" value={stats.myRecords} color="warning" icon="person-badge" />
          </Col>
        </Row>

        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 pt-3">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-gear-fill me-2"></i>Quick Actions
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-3">
              <Button as={Link} to="/overall-report" variant="success" className="px-4 py-2">
                <i className="bi bi-bar-chart-fill me-2"></i>Overall Report
              </Button>
              <Button as={Link} to="/barangay-report" variant="outline-success" className="px-4 py-2">
                <i className="bi bi-building me-2"></i>Barangay Report
              </Button>
              <Button as={Link} to="/admin/staff" variant="outline-secondary" className="px-4 py-2">
                <i className="bi bi-people-fill me-2"></i>Manage Staff
              </Button>
              <Button as={Link} to="/data-entry" variant="outline-primary" className="px-4 py-2">
                <i className="bi bi-plus-circle-fill me-2"></i>Data Entry
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container fluid className="px-3 px-md-4">
      <DashboardHeader 
        title={`BNS Dashboard`}
        subtitle={`Welcome back, ${user?.username}!`}
        role={user?.role?.toUpperCase() || 'STAFF'}
      />

      <Row className="g-4 mb-4">
        <Col xs={12} sm={6}>
          <StatCard title="My Records" value={stats.myRecords} color="primary" icon="file-earmark-text" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Total Children" value={stats.totalChildren} color="success" icon="people" />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-3">
          <h5 className="mb-0 fw-bold text-success">
            <i className="bi bi-gear-fill me-2"></i>Quick Actions
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-wrap gap-3">
            <Button as={Link} to="/data-entry" variant="success" className="px-4 py-2">
              <i className="bi bi-plus-circle-fill me-2"></i>Add Child Record
            </Button>
            <Button as={Link} to="/barangay-report" variant="outline-success" className="px-4 py-2">
              <i className="bi bi-building me-2"></i>View Barangay Report
            </Button>
            <Button as={Link} to="/data-entry" variant="outline-primary" className="px-4 py-2">
              <i className="bi bi-eye-fill me-2"></i>View My Records
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Dashboard