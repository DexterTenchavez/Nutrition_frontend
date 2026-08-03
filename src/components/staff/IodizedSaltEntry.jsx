import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { iodizedSaltApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col } from 'react-bootstrap'

const IodizedSaltEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    storeName: '',
    fineSaltFidel: false,
    fineSaltUFC: false,
    fineSaltPacificBay: false,
    fineSaltOthers: '',
    rockSaltAtlantic: false,
    rockSaltFidel: false,
    rockSaltLasap: false,
    rockSaltPagAsa: false,
    rockSaltJay: false,
    rockSaltOthers: '',
    oilUFC: false,
    oilJolly: false,
    oilOthers: '',
    preparedBy: '',
    notedBy: '',
    approvedBy: ''
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [selectedBarangay, setSelectedBarangay] = useState(user?.barangay || '')

  useEffect(() => {
    if (selectedBarangay) {
      fetchRecords()
    }
  }, [selectedBarangay])

  const fetchRecords = async () => {
    try {
      const data = await iodizedSaltApi.getByBarangay(selectedBarangay)
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
        purok: parseInt(formData.purok)
      }

      if (editingId) {
        await iodizedSaltApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await iodizedSaltApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        storeName: '',
        fineSaltFidel: false,
        fineSaltUFC: false,
        fineSaltPacificBay: false,
        fineSaltOthers: '',
        rockSaltAtlantic: false,
        rockSaltFidel: false,
        rockSaltLasap: false,
        rockSaltPagAsa: false,
        rockSaltJay: false,
        rockSaltOthers: '',
        oilUFC: false,
        oilJolly: false,
        oilOthers: '',
        preparedBy: '',
        notedBy: '',
        approvedBy: ''
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
      storeName: record.storeName || '',
      fineSaltFidel: record.fineSaltFidel,
      fineSaltUFC: record.fineSaltUFC,
      fineSaltPacificBay: record.fineSaltPacificBay,
      fineSaltOthers: record.fineSaltOthers || '',
      rockSaltAtlantic: record.rockSaltAtlantic,
      rockSaltFidel: record.rockSaltFidel,
      rockSaltLasap: record.rockSaltLasap,
      rockSaltPagAsa: record.rockSaltPagAsa,
      rockSaltJay: record.rockSaltJay,
      rockSaltOthers: record.rockSaltOthers || '',
      oilUFC: record.oilUFC,
      oilJolly: record.oilJolly,
      oilOthers: record.oilOthers || '',
      preparedBy: record.preparedBy || '',
      notedBy: record.notedBy || '',
      approvedBy: record.approvedBy || ''
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await iodizedSaltApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    }
  }

  return (
    <div>
      <h4 className="mb-4">Sari-Sari Stores Selling Iodized Salt</h4>

      <Row className="mb-3">
        <Col md={6}>
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
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Store Entry</h6>
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
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Store Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="Enter store name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Fine Iodized Salt</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Fidel"
                  checked={formData.fineSaltFidel}
                  onChange={(e) => setFormData({ ...formData, fineSaltFidel: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="UFC"
                  checked={formData.fineSaltUFC}
                  onChange={(e) => setFormData({ ...formData, fineSaltUFC: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Pacific Bay"
                  checked={formData.fineSaltPacificBay}
                  onChange={(e) => setFormData({ ...formData, fineSaltPacificBay: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Control
                    type="text"
                    placeholder="Others"
                    value={formData.fineSaltOthers}
                    onChange={(e) => setFormData({ ...formData, fineSaltOthers: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Rock Salt (Coarse) Iodized Salt</h6>
            <Row className="mb-3">
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Atlantic"
                  checked={formData.rockSaltAtlantic}
                  onChange={(e) => setFormData({ ...formData, rockSaltAtlantic: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Fidel"
                  checked={formData.rockSaltFidel}
                  onChange={(e) => setFormData({ ...formData, rockSaltFidel: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Lasap"
                  checked={formData.rockSaltLasap}
                  onChange={(e) => setFormData({ ...formData, rockSaltLasap: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Pag-Asa"
                  checked={formData.rockSaltPagAsa}
                  onChange={(e) => setFormData({ ...formData, rockSaltPagAsa: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Jay"
                  checked={formData.rockSaltJay}
                  onChange={(e) => setFormData({ ...formData, rockSaltJay: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="text"
                  placeholder="Others"
                  value={formData.rockSaltOthers}
                  onChange={(e) => setFormData({ ...formData, rockSaltOthers: e.target.value })}
                />
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Fortified Cooking Oil</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="UFC"
                  checked={formData.oilUFC}
                  onChange={(e) => setFormData({ ...formData, oilUFC: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Jolly"
                  checked={formData.oilJolly}
                  onChange={(e) => setFormData({ ...formData, oilJolly: e.target.checked })}
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Others"
                  value={formData.oilOthers}
                  onChange={(e) => setFormData({ ...formData, oilOthers: e.target.value })}
                />
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prepared By</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.preparedBy}
                    onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Noted By</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.notedBy}
                    onChange={(e) => setFormData({ ...formData, notedBy: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Approved By</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
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
                  storeName: '',
                  fineSaltFidel: false,
                  fineSaltUFC: false,
                  fineSaltPacificBay: false,
                  fineSaltOthers: '',
                  rockSaltAtlantic: false,
                  rockSaltFidel: false,
                  rockSaltLasap: false,
                  rockSaltPagAsa: false,
                  rockSaltJay: false,
                  rockSaltOthers: '',
                  oilUFC: false,
                  oilJolly: false,
                  oilOthers: '',
                  preparedBy: '',
                  notedBy: '',
                  approvedBy: ''
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
                <th>Store</th>
                <th>Fine Salt</th>
                <th>Rock Salt</th>
                <th>Oil</th>
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
                    <td>{record.storeName}</td>
                    <td>
                      {record.fineSaltFidel && 'Fidel '}
                      {record.fineSaltUFC && 'UFC '}
                      {record.fineSaltPacificBay && 'Pacific Bay '}
                      {record.fineSaltOthers}
                    </td>
                    <td>
                      {record.rockSaltAtlantic && 'Atlantic '}
                      {record.rockSaltFidel && 'Fidel '}
                      {record.rockSaltLasap && 'Lasap '}
                      {record.rockSaltPagAsa && 'Pag-Asa '}
                      {record.rockSaltJay && 'Jay '}
                      {record.rockSaltOthers}
                    </td>
                    <td>
                      {record.oilUFC && 'UFC '}
                      {record.oilJolly && 'Jolly '}
                      {record.oilOthers}
                    </td>
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

export default IodizedSaltEntry