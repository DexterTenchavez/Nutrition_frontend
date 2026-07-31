import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import { BARANGAYS } from '../utils/constants'
import { Card, Table, Button, Form, Alert, Modal, Badge, Spinner } from 'react-bootstrap'

const AdminStaff = () => {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    barangay: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/staff')
      setStaff(response.data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/admin/staff', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        barangay: formData.barangay,
      })

      setSuccess('Staff created successfully!')
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        barangay: '',
      })
      setShowModal(false)
      fetchStaff()
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating staff')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStaffStatus = async (id) => {
    try {
      await api.put(`/admin/staff/${id}/toggle`)
      fetchStaff()
    } catch (error) {
      console.error('Error toggling staff:', error)
      alert('Error updating staff status')
    }
  }

  const deleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff?')) return
    try {
      await api.delete(`/admin/staff/${id}`)
      fetchStaff()
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff')
    }
  }

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-5">Access denied. Admin only.</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Staff Management</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Add Staff
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-muted text-center py-3">No staff created yet</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Barangay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((staffMember) => (
                  <tr key={staffMember.id}>
                    <td>{staffMember.username}</td>
                    <td>{staffMember.email}</td>
                    <td>{staffMember.barangay}</td>
                    <td>
                      <Badge bg={staffMember.isActive ? 'success' : 'danger'}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant={staffMember.isActive ? 'warning' : 'success'}
                        size="sm"
                        className="me-2"
                        onClick={() => toggleStaffStatus(staffMember.id)}
                      >
                        {staffMember.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteStaff(staffMember.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Staff Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Staff Account</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Barangay</Form.Label>
              <Form.Select
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                required
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminStaff