import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { childRecordApi } from '../api/auth'
import { Card, Row, Col, Spinner, Container } from 'react-bootstrap'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const STATUS_COLORS = {
  'Normal': '#198754',
  'MAM': '#ffc107',
  'SAM': '#fd7e14',
  'Underweight': '#dc3545',
  'Severely Underweight': '#6f0000',
}

const AGE_COLORS = ['#198754', '#20c997']

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [records, setRecords] = useState([])
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
      const data = await childRecordApi.getAll()
      const barangays = new Set(data.map(r => r.barangay))
      const myRecords = data.filter(r => r.recordedBy === user?.id).length

      setRecords(data)
      setStats({
        totalRecords: data.length,
        totalBarangays: barangays.size,
        totalChildren: data.length,
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

  // Scope: admin sees all records, staff sees only their own
  const scopedRecords = isAdmin ? records : records.filter(r => r.recordedBy === user?.id)

  // Barangay distribution (top 8 by count)
  const barangayCounts = {}
  scopedRecords.forEach(r => {
    barangayCounts[r.barangay] = (barangayCounts[r.barangay] || 0) + 1
  })
  const barangayData = Object.entries(barangayCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Nutritional status breakdown
  const statusCounts = {}
  scopedRecords.forEach(r => {
    statusCounts[r.nutritionalStatus] = (statusCounts[r.nutritionalStatus] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Age group breakdown
  const ageGroups = { '6-11 months': 0, '12-59 months': 0 }
  scopedRecords.forEach(r => {
    if (r.ageMonths >= 6 && r.ageMonths <= 11) ageGroups['6-11 months']++
    else if (r.ageMonths >= 12 && r.ageMonths <= 59) ageGroups['12-59 months']++
  })
  const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }))

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

  const AnalyticsSection = () => (
    <Row className="g-4">
      <Col xs={12} lg={7}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Header className="bg-white border-0 pt-3">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-bar-chart-fill me-2"></i>
              {isAdmin ? 'Records by Barangay (Top 8)' : 'My Records by Barangay'}
            </h5>
          </Card.Header>
          <Card.Body>
            {barangayData.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">No records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barangayData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="barangay" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#198754" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12} lg={5}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Header className="bg-white border-0 pt-3">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-pie-chart-fill me-2"></i>Nutritional Status
            </h5>
          </Card.Header>
          <Card.Body>
            {statusData.length === 0 ? (
              <p className="text-muted text-center py-5 mb-0">No records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] || '#adb5bd'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 pt-3">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-people-fill me-2"></i>Age Group Distribution
            </h5>
          </Card.Header>
          <Card.Body>
            {ageData.every(a => a.value === 0) ? (
              <p className="text-muted text-center py-5 mb-0">No records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {ageData.map((entry, index) => (
                      <Cell key={index} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )

  if (isAdmin) {
    return (
      <Container fluid className="px-3 px-md-4">
        <DashboardHeader
          title="Admin Dashboard"
          subtitle="System-wide overview"
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

        <AnalyticsSection />
      </Container>
    )
  }

  return (
    <Container fluid className="px-3 px-md-4">
      <DashboardHeader
        title="BNS Dashboard"
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

      <AnalyticsSection />
    </Container>
  )
}

export default Dashboard