import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reportApi } from '../api/auth'
import { Card, Spinner, Table, Badge, Button } from 'react-bootstrap'

const BarangayReport = () => {
  const { name } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBarangayReport()
  }, [name])

  const fetchBarangayReport = async () => {
    try {
      const data = await reportApi.getBarangaySummary(name)
      setReport(data)
    } catch (error) {
      console.error('Error fetching barangay report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading barangay report...</p>
      </div>
    )
  }

  if (!report) {
    return <div className="text-center py-5 text-muted">No report found for {name}</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{report.barangay} - Report</h1>
        <Button as={Link} to="/reports" variant="secondary">
          Back to Reports
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex gap-4 flex-wrap">
            <div>
              <h6 className="text-muted">Total Reports</h6>
              <h3>{report.totalReports}</h3>
            </div>
            <div>
              <h6 className="text-muted">6-11 months</h6>
              <h3>{report.totalMonths6To11}</h3>
            </div>
            <div>
              <h6 className="text-muted">12-59 months</h6>
              <h3>{report.totalMonths12To59}</h3>
            </div>
            <div>
              <h6 className="text-muted">UW & SUW</h6>
              <h3>{report.totalUnderweightSUW}</h3>
            </div>
            <div>
              <h6 className="text-muted">Total Children</h6>
              <h3>{report.totalChildren}</h3>
            </div>
          </div>
        </Card.Body>
      </Card>

      {report.reportsByPurok && report.reportsByPurok.length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Purok Details</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Purok</th>
                  <th className="text-center">Total Children</th>
                  <th className="text-center">Reports</th>
                </tr>
              </thead>
              <tbody>
                {report.reportsByPurok.map((purok) => (
                  <tr key={purok.purok}>
                    <td>Purok {purok.purok}</td>
                    <td className="text-center fw-bold">{purok.totalChildren}</td>
                    <td className="text-center">{purok.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

// ✅ ADD THIS - Default export
export default BarangayReport