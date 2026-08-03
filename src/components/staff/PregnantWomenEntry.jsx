import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { pregnantWomenApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap'

const PregnantWomenEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    highBMI: '0',
    lowBMI: '0',
    normalBMI: '0',
    year: new Date().getFullYear(),
    recordedBy: user?.username || ''
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [selectedBarangay, setSelectedBarangay] = useState(user?.barangay || '')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (selectedBarangay) {
      fetchRecords()
    }
  }, [selectedBarangay, selectedYear])

  const fetchRecords = async () => {
    try {
      const data = await pregnantWomenApi.getByBarangay(selectedBarangay, selectedYear)
      setRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        purok: parseInt(formData.purok),
        highBMI: parseInt(formData.highBMI) || 0,
        lowBMI: parseInt(formData.lowBMI) || 0,
        normalBMI: parseInt(formData.normalBMI) || 0,
        year: parseInt(formData.year)
      }

      if (editingId) {
        await pregnantWomenApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await pregnantWomenApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        highBMI: '0',
        lowBMI: '0',
        normalBMI: '0',
        year: new Date().getFullYear(),
        recordedBy: user?.username || ''
      })
      setEditingId(null)
      fetchRecords()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error saving record'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      highBMI: record.highBMI,
      lowBMI: record.lowBMI,
      normalBMI: record.normalBMI,
      year: record.year,
      recordedBy: record.recordedBy || user?.username || ''
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await pregnantWomenApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    }
  }

  return (
    <div>
      <h4 className="mb-4">Pregnant Women BMI Report</h4>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Barangay</Form.Label>
            <Form.Select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
            >
              <option value="">Select Barangay</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Year</Form.Label>
            <Form.Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Entry</h6>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    required
                  >
                    <option value="">Select Purok</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">BMI Categories</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>High BMI</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.highBMI}
                    onChange={(e) => setFormData({ ...formData, highBMI: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Low BMI</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.lowBMI}
                    onChange={(e) => setFormData({ ...formData, lowBMI: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Normal BMI</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.normalBMI}
                    onChange={(e) => setFormData({ ...formData, normalBMI: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={() => {
                setEditingId(null)
                setFormData({
                  barangay: user?.barangay || '',
                  purok: '',
                  highBMI: '0',
                  lowBMI: '0',
                  normalBMI: '0',
                  year: new Date().getFullYear(),
                  recordedBy: user?.username || ''
                })
              }}>
                Cancel
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h6 className="mb-0">Records</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0" size="sm">
            <thead>
              <tr>
                <th>Purok</th>
                <th>High BMI</th>
                <th>Low BMI</th>
                <th>Normal BMI</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-3 text-muted">No records found</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>Purok {record.purok}</td>
                    <td>{record.highBMI}</td>
                    <td>{record.lowBMI}</td>
                    <td>{record.normalBMI}</td>
                    <td>{record.highBMI + record.lowBMI + record.normalBMI}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(record)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" className="ms-1" onClick={() => handleDelete(record.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}

export default PregnantWomenEntry