import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { reportApi } from '../api/auth'
import { Card, Row, Col, Table, Badge, Spinner, Button } from 'react-bootstrap'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    barangays: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentReports, setRecentReports] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const reports = await reportApi.getAll()
      const approved = reports.filter(r => r.status === 'approved')
      const pending = reports.filter(r => r.status === 'pending')

      setStats({
        totalReports: reports.length,
        pendingReports: pending.length,
        approvedReports: approved.length,
        barangays: new Set(reports.map(r => r.barangay)).size,
      })

      setRecentReports(reports.slice(0, 5))
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

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Reports</h6>
              <h2 className="mb-0">{stats.totalReports}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h6 className="text-muted">Pending</h6>
              <h2 className="mb-0 text-warning">{stats.pendingReports}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h6 className="text-muted">Approved</h6>
              <h2 className="mb-0 text-success">{stats.approvedReports}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h6 className="text-muted">Barangays</h6>
              <h2 className="mb-0 text-primary">{stats.barangays}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Reports</h5>
        </Card.Header>
        <Card.Body>
          {recentReports.length === 0 ? (
            <p className="text-muted text-center">No reports yet</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.barangay}</td>
                    <td>{new Date(report.reportedDate).toLocaleDateString()}</td>
                    <td>
                      <Badge bg={
                        report.status === 'approved' ? 'success' :
                        report.status === 'pending' ? 'warning' : 'danger'
                      }>
                        {report.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        as={Link}
                        to={`/barangay/${report.barangay}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default Dashboard