import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { childRecordApi } from '../../api/auth'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap'

const ChildRecordsEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    targetCategory: 'Child (0–59 months)',
    fullName: '',
    ageMonths: '',
    weight: '',
    height: '',
    nutritionalStatus: '',
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const data = await childRecordApi.getAll()
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
        ageMonths: parseInt(formData.ageMonths),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
      }

      if (editingId) {
        await childRecordApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await childRecordApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        targetCategory: 'Child (0–59 months)',
        fullName: '',
        ageMonths: '',
        weight: '',
        height: '',
        nutritionalStatus: '',
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
      targetCategory: record.targetCategory,
      fullName: record.fullName,
      ageMonths: record.ageMonths,
      weight: record.weight,
      height: record.height,
      nutritionalStatus: record.nutritionalStatus,
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await childRecordApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    }
  }

  return (
    <div>
      <h4 className="mb-4">Child Records (0-59 months)</h4>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Record</h6>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barangay</Form.Label>
                  <Form.Select
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    required
                   
                  >
                    <option value="">Select Barangay</option>
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age (Months)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.ageMonths}
                    onChange={(e) => setFormData({ ...formData, ageMonths: e.target.value })}
                    required
                    placeholder="e.g., 24"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (KG)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                    placeholder="e.g., 11.5"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height (CM)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                    placeholder="e.g., 85.0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nutritional Status</Form.Label>
                  <Form.Select
                    value={formData.nutritionalStatus}
                    onChange={(e) => setFormData({ ...formData, nutritionalStatus: e.target.value })}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Normal">Normal</option>
                    <option value="MAM">MAM</option>
                    <option value="SAM">SAM</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                  </Form.Select>
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
                  targetCategory: 'Child (0–59 months)',
                  fullName: '',
                  ageMonths: '',
                  weight: '',
                  height: '',
                  nutritionalStatus: '',
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
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Barangay</th>
                <th>Purok</th>
                <th>Name</th>
                <th>Age (mos)</th>
                <th>Weight</th>
                <th>Height</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-3 text-muted">No records found</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.barangay}</td>
                    <td>Purok {record.purok}</td>
                    <td>{record.fullName}</td>
                    <td>{record.ageMonths}</td>
                    <td>{record.weight}</td>
                    <td>{record.height}</td>
                    <td>{record.nutritionalStatus}</td>
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

export default ChildRecordsEntry