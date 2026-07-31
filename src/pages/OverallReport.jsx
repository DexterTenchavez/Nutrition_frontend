import { useState, useEffect } from 'react'
import { reportApi } from '../api/auth'
import { BARANGAYS } from '../utils/constants'
import { Card, Row, Col, Form, Spinner, Table, Badge } from 'react-bootstrap'

const OverallReport = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState('')

  useEffect(() => {
    fetchOverallReport()
  }, [year, quarter])

  const fetchOverallReport = async () => {
    try {
      const params = { year }
      if (quarter) params.quarter = quarter
      
      const data = await reportApi.getOverall(params)
      setReport(data)
    } catch (error) {
      console.error('Error fetching overall report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading overall report...</p>
      </div>
    )
  }

  if (!report) {
    return <div className="text-center py-5 text-muted">No data available</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Overall Report - {report.year}</h1>
        <div className="d-flex gap-2">
          <Form.Select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: '100px' }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Form.Select>
          <Form.Select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="">All Quarters</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </Form.Select>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted">Total Barangays</h6>
              <h2 className="mb-0">{report.overallTotal.totalBarangays}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <h6 className="text-muted">6-11 months</h6>
              <h2 className="mb-0 text-info">{report.overallTotal.totalMonths6To11}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h6 className="text-muted">12-59 months</h6>
              <h2 className="mb-0 text-success">{report.overallTotal.totalMonths12To59}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h6 className="text-muted">UW & SUW</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal.totalUnderweightSUW}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Barangay Summary</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive striped hover className="mb-0">
            <thead>
              <tr>
                <th>Barangay</th>
                <th className="text-center">6-11 months</th>
                <th className="text-center">12-59 months</th>
                <th className="text-center">UW & SUW</th>
                <th className="text-center">Total</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.barangayReports.map((barangay) => (
                <tr key={barangay.barangay}>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.months6To11}</td>
                  <td className="text-center">{barangay.months12To59}</td>
                  <td className="text-center">{barangay.underweightSUW}</td>
                  <td className="text-center fw-bold">{barangay.total}</td>
                  <td className="text-center">
                    <Badge bg={barangay.status === 'Completed' ? 'success' : 'secondary'}>
                      {barangay.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td>TOTAL</td>
                <td className="text-center">{report.overallTotal.totalMonths6To11}</td>
                <td className="text-center">{report.overallTotal.totalMonths12To59}</td>
                <td className="text-center">{report.overallTotal.totalUnderweightSUW}</td>
                <td className="text-center">{report.overallTotal.grandTotal}</td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="mt-4 text-muted small">
        <p>Prepared By: Cristine A. Macahis, MNPC</p>
        <p>Noted By: Jehd Stephen O. Cutamora, RN</p>
      </div>
    </div>
  )
}

export default OverallReport