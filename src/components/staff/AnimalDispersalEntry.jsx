import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { animalDispersalApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap'

const AnimalDispersalEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    totalHouseholds: '',
    householdsReceived: '0',
    chickenMale: '0',
    chickenFemale: '0',
    pigMale: '0',
    pigFemale: '0',
    goatMale: '0',
    goatFemale: '0',
    cowMale: '0',
    cowFemale: '0',
    carabaoMale: '0',
    carabaoFemale: '0',
    signature: '',
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
      const data = await animalDispersalApi.getByBarangay(selectedBarangay, selectedYear)
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
        totalHouseholds: parseInt(formData.totalHouseholds),
        householdsReceived: parseInt(formData.householdsReceived) || 0,
        chickenMale: parseInt(formData.chickenMale) || 0,
        chickenFemale: parseInt(formData.chickenFemale) || 0,
        pigMale: parseInt(formData.pigMale) || 0,
        pigFemale: parseInt(formData.pigFemale) || 0,
        goatMale: parseInt(formData.goatMale) || 0,
        goatFemale: parseInt(formData.goatFemale) || 0,
        cowMale: parseInt(formData.cowMale) || 0,
        cowFemale: parseInt(formData.cowFemale) || 0,
        carabaoMale: parseInt(formData.carabaoMale) || 0,
        carabaoFemale: parseInt(formData.carabaoFemale) || 0,
        year: parseInt(formData.year)
      }

      if (editingId) {
        await animalDispersalApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await animalDispersalApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        totalHouseholds: '',
        householdsReceived: '0',
        chickenMale: '0',
        chickenFemale: '0',
        pigMale: '0',
        pigFemale: '0',
        goatMale: '0',
        goatFemale: '0',
        cowMale: '0',
        cowFemale: '0',
        carabaoMale: '0',
        carabaoFemale: '0',
        signature: '',
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
      totalHouseholds: record.totalHouseholds,
      householdsReceived: record.householdsReceived,
      chickenMale: record.chickenMale,
      chickenFemale: record.chickenFemale,
      pigMale: record.pigMale,
      pigFemale: record.pigFemale,
      goatMale: record.goatMale,
      goatFemale: record.goatFemale,
      cowMale: record.cowMale,
      cowFemale: record.cowFemale,
      carabaoMale: record.carabaoMale,
      carabaoFemale: record.carabaoFemale,
      signature: record.signature || '',
      year: record.year,
      recordedBy: record.recordedBy || user?.username || ''
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await animalDispersalApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    }
  }

  return (
    <div>
      <h4 className="mb-4">Household with Malnourished Children Received Animal Dispersal</h4>

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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Households</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.totalHouseholds}
                    onChange={(e) => setFormData({ ...formData, totalHouseholds: e.target.value })}
                    required
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Households Received</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.householdsReceived}
                    onChange={(e) => setFormData({ ...formData, householdsReceived: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Signature of BHW/Kagawad</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                    placeholder="Signature"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Animals Dispersed</h6>
            <Row>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Chicken M</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.chickenMale}
                    onChange={(e) => setFormData({ ...formData, chickenMale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Chicken F</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.chickenFemale}
                    onChange={(e) => setFormData({ ...formData, chickenFemale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Pig M</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.pigMale}
                    onChange={(e) => setFormData({ ...formData, pigMale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Pig F</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.pigFemale}
                    onChange={(e) => setFormData({ ...formData, pigFemale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Goat M</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.goatMale}
                    onChange={(e) => setFormData({ ...formData, goatMale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Goat F</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.goatFemale}
                    onChange={(e) => setFormData({ ...formData, goatFemale: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Cow M</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.cowMale}
                    onChange={(e) => setFormData({ ...formData, cowMale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Cow F</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.cowFemale}
                    onChange={(e) => setFormData({ ...formData, cowFemale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Carabao M</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.carabaoMale}
                    onChange={(e) => setFormData({ ...formData, carabaoMale: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Carabao F</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.carabaoFemale}
                    onChange={(e) => setFormData({ ...formData, carabaoFemale: e.target.value })}
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
                  totalHouseholds: '',
                  householdsReceived: '0',
                  chickenMale: '0',
                  chickenFemale: '0',
                  pigMale: '0',
                  pigFemale: '0',
                  goatMale: '0',
                  goatFemale: '0',
                  cowMale: '0',
                  cowFemale: '0',
                  carabaoMale: '0',
                  carabaoFemale: '0',
                  signature: '',
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
                <th>Total HH</th>
                <th>Received</th>
                <th>Chicken M/F</th>
                <th>Pig M/F</th>
                <th>Goat M/F</th>
                <th>Cow M/F</th>
                <th>Carabao M/F</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-3 text-muted">No records found</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>Purok {record.purok}</td>
                    <td>{record.totalHouseholds}</td>
                    <td>{record.householdsReceived}</td>
                    <td>{record.chickenMale}/{record.chickenFemale}</td>
                    <td>{record.pigMale}/{record.pigFemale}</td>
                    <td>{record.goatMale}/{record.goatFemale}</td>
                    <td>{record.cowMale}/{record.cowFemale}</td>
                    <td>{record.carabaoMale}/{record.carabaoFemale}</td>
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

export default AnimalDispersalEntry