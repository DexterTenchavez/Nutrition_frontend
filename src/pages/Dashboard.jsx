import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { childRecordApi } from '../api/auth'
import { Card, Row, Col, Spinner, Button } from 'react-bootstrap'

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

  if (isAdmin) {
    return (
      <div>
        <h1 className="mb-4">Admin Dashboard</h1>

        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h6 className="text-muted">Total Records</h6>
                <h2 className="mb-0">{stats.totalRecords}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-primary">
              <Card.Body>
                <h6 className="text-muted">Barangays with Data</h6>
                <h2 className="mb-0 text-primary">{stats.totalBarangays}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-success">
              <Card.Body>
                <h6 className="text-muted">Total Children</h6>
                <h2 className="mb-0 text-success">{stats.totalChildren}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card>
          <Card.Header>
            <h5 className="mb-0">Quick Actions</h5>
          </Card.Header>
          <Card.Body>
            <div className="d-flex gap-3 flex-wrap">
              <Button as={Link} to="/overall-report" variant="primary">
                View Overall Report
              </Button>
              <Button as={Link} to="/barangay-report" variant="outline-primary">
                View Barangay Report
              </Button>
              <Button as={Link} to="/admin/staff" variant="outline-secondary">
                Manage Staff
              </Button>
              <Button as={Link} to="/data-entry" variant="outline-secondary">
                Data Entry
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4">Welcome, {user?.username}</h1>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h6 className="text-muted">My Records Submitted</h6>
              <h2 className="mb-0 text-primary">{stats.myRecords}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-center border-success">
            <Card.Body>
              <h6 className="text-muted">Total Children Recorded (All Staff)</h6>
              <h2 className="mb-0 text-success">{stats.totalChildren}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-3 flex-wrap">
            <Button as={Link} to="/data-entry" variant="primary">
              Add Child Record
            </Button>
            <Button as={Link} to="/barangay-report" variant="outline-primary">
              View Barangay Report
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Dashboard