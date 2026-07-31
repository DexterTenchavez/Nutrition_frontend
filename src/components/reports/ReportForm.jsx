import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Form, Button, Row, Col, Table, Card, Alert } from 'react-bootstrap'

const ReportForm = ({ initialData, onSubmit, onCancel, barangays }) => {
  const { user, isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    quarter: '',
    year: new Date().getFullYear(),
    remarks: '',
    puroks: {
      1: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      2: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      3: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      4: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      5: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      6: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
      7: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
    }
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        barangay: initialData.barangay || '',
        quarter: initialData.quarter || '',
        year: initialData.year || new Date().getFullYear(),
        remarks: initialData.remarks || '',
        puroks: initialData.puroks || {
          1: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          2: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          3: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          4: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          5: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          6: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
          7: { months6To11: 0, months12To59: 0, underweightSUW: 0 },
        }
      })
    }
  }, [initialData])

  const handlePurokChange = (purok, field, value) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      puroks: {
        ...prev.puroks,
        [purok]: {
          ...prev.puroks[purok],
          [field]: numValue
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const purokData = []
      Object.keys(formData.puroks).forEach((key) => {
        const p = formData.puroks[key]
        purokData.push({
          purok: parseInt(key),
          months6To11: p.months6To11,
          months12To59: p.months12To59,
          underweightSUW: p.underweightSUW,
        })
      })

      await onSubmit({
        barangay: formData.barangay,
        quarter: formData.quarter,
        year: parseInt(formData.year),
        remarks: formData.remarks,
        puroks: purokData,
      })
    } catch (err) {
      setError(err.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate totals
  const totals = Object.keys(formData.puroks).reduce((acc, key) => {
    const p = formData.puroks[key]
    acc.months6To11 += p.months6To11
    acc.months12To59 += p.months12To59
    acc.underweightSUW += p.underweightSUW
    return acc
  }, { months6To11: 0, months12To59: 0, underweightSUW: 0 })

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Barangay</Form.Label>
            <Form.Select
              value={formData.barangay}
              onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              required
              disabled={!isAdmin && !!user?.barangay}
            >
              <option value="">Select Barangay</option>
              {barangays.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Quarter</Form.Label>
            <Form.Select
              value={formData.quarter}
              onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
            >
              <option value="">Select Quarter</option>
              <option value="Q1">Q1 (Jan-Mar)</option>
              <option value="Q2">Q2 (Apr-Jun)</option>
              <option value="Q3">Q3 (Jul-Sep)</option>
              <option value="Q4">Q4 (Oct-Dec)</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Year</Form.Label>
            <Form.Control
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />
          </Form.Group>
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">Vitamin A Supplementation Report</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive striped hover className="mb-0">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Purok</th>
                <th className="text-center">6-11 Months</th>
                <th className="text-center">12-59 Months</th>
                <th className="text-center">Underweight & SUW</th>
                <th className="text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map((purok) => {
                const p = formData.puroks[purok]
                const purokTotal = p.months6To11 + p.months12To59 + p.underweightSUW
                return (
                  <tr key={purok}>
                    <td><strong>Purok {purok}</strong></td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={p.months6To11}
                        onChange={(e) => handlePurokChange(purok, 'months6To11', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={p.months12To59}
                        onChange={(e) => handlePurokChange(purok, 'months12To59', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={p.underweightSUW}
                        onChange={(e) => handlePurokChange(purok, 'underweightSUW', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="text-center fw-bold">{purokTotal}</td>
                  </tr>
                )
              })}
              <tr className="table-primary fw-bold">
                <td>TOTAL</td>
                <td className="text-center">{totals.months6To11}</td>
                <td className="text-center">{totals.months12To59}</td>
                <td className="text-center">{totals.underweightSUW}</td>
                <td className="text-center">{totals.months6To11 + totals.months12To59 + totals.underweightSUW}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Form.Group className="mb-3">
        <Form.Label>Remarks</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Optional remarks..."
        />
      </Form.Group>

      <div className="d-flex gap-2">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Submitting...' : (initialData ? 'Update Report' : 'Submit Report')}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </Form>
  )
}

export default ReportForm