import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { reportApi } from '../api/auth'
import ReportForm from '../components/reports/ReportForm'
import ReportTable from '../components/reports/ReportTable'
import { BARANGAYS } from '../utils/constants'
import { Button, Card, Row, Col, Form, Spinner } from 'react-bootstrap'

const Reports = () => {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState({
    barangay: '',
    status: '',
  })
  const [editingReport, setEditingReport] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.barangay) params.barangay = filter.barangay
      if (filter.status) params.status = filter.status
      
      const data = await reportApi.getAll(params)
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data) => {
    try {
      if (editingReport) {
        await reportApi.update(editingReport.id, data)
      } else {
        await reportApi.create(data)
      }
      setShowForm(false)
      setEditingReport(null)
      fetchReports()
    } catch (error) {
      console.error('Error saving report:', error)
      alert(error.response?.data?.message || 'Error saving report')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    try {
      await reportApi.delete(id)
      fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Error deleting report')
    }
  }

  const handleApprove = async (id) => {
    try {
      await reportApi.approve(id)
      fetchReports()
    } catch (error) {
      console.error('Error approving report:', error)
      alert('Error approving report')
    }
  }

  const handleEdit = (report) => {
    // Convert single report to the format expected by ReportForm
    const editData = {
      barangay: report.barangay,
      quarter: report.quarter || '',
      year: report.year || new Date().getFullYear(),
      remarks: report.remarks || '',
      puroks: {
        [report.purok]: {
          months6To11: report.months6To11 || 0,
          months12To59: report.months12To59 || 0,
          underweightSUW: report.underweightSUW || 0
        }
      }
    }
    setEditingReport(editData)
    setShowForm(true)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reports</h1>
        <Button
          variant="primary"
          onClick={() => {
            setEditingReport(null)
            setShowForm(!showForm)
          }}
        >
          {showForm ? 'Cancel' : '+ New Report'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">{editingReport ? 'Edit Report' : 'New Report'}</h5>
          </Card.Header>
          <Card.Body>
            <ReportForm
              initialData={editingReport}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingReport(null)
              }}
              barangays={BARANGAYS}
            />
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={filter.barangay}
                onChange={(e) => setFilter({ ...filter, barangay: e.target.value })}
              >
                <option value="">All Barangays</option>
                {BARANGAYS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-secondary" onClick={fetchReports}>
                Refresh
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <ReportTable
              reports={reports}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default Reports