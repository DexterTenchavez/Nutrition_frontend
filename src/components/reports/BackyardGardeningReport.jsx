import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { backyardGardeningApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const BackyardGardeningReport = () => {
  const { user } = useAuth()
  const [barangay, setBarangay] = useState('')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, startDate, endDate])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch all records (year = 0 means all)
      const data = await backyardGardeningApi.getByBarangay(barangay, 0)
      
      // Filter by date range
      const filtered = data.filter(r => {
        const recordDate = new Date(r.recordedDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return recordDate >= start && recordDate <= end
      })
      
      setRecords(filtered)
      generateReport(filtered)
    } catch (error) {
      setError('Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = (data) => {
    const purokReports = []
    for (let p = 1; p <= 7; p++) {
      const purokRecords = data.filter(r => r.purok === p)
      purokReports.push({
        purok: p,
        withGarden: purokRecords.filter(r => r.hasGarden === true).length,
        withoutGarden: purokRecords.filter(r => r.hasGarden === false).length
      })
    }
    const total = {
      withGarden: purokReports.reduce((sum, p) => sum + p.withGarden, 0),
      withoutGarden: purokReports.reduce((sum, p) => sum + p.withoutGarden, 0)
    }
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    const yearDisplay = startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
    setReport({ purokReports, total, barangay, year: yearDisplay, startDate, endDate })
  }

  const handleExportPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const barangayName = barangay.toUpperCase()

    const logoImg = new Image()
    logoImg.src = nutritionLogo
    doc.addImage(logoImg, 'JPEG', 14, 8, 22, 22)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CONSOLIDATED REPORT ON', pageWidth / 2, 18, { align: 'center' })
    doc.text(`WITH AND WITHOUT BACKYARD GARDENING CY:${report.year}`, pageWidth / 2, 26, { align: 'center' })

    doc.setFontSize(11)
    doc.text(`BARANGAY: ${barangayName}`, 14, 38)
    doc.text(`DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 46)

    const body = report.purokReports.map((p) => [
      p.purok,
      p.withGarden || 0,
      p.withoutGarden || 0
    ])

    body.push([
      'TOTAL',
      report.total.withGarden || 0,
      report.total.withoutGarden || 0
    ])

    autoTable(doc, {
      startY: 52,
      head: [['PUROK', 'WITH GARDEN', 'WITHOUT GARDEN']],
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineWidth: 0.3 },
      bodyStyles: { lineWidth: 0.3 },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } }
    })

    const finalY = doc.lastAutoTable.finalY + 25

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFIED CORRECT:', 14, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', 60, finalY)
    doc.text('BNS', 65, finalY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('APPROVED BY:', pageWidth - 80, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', pageWidth - 45, finalY)
    doc.text('BRGY. CAPTAIN', pageWidth - 45, finalY + 6)

    doc.save(`Backyard_Gardening_Report_${barangayName}_${report.year}.pdf`)
  }

  return (
    <div>
      <h4 className="mb-4">Backyard Gardening Report</h4>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Barangay</Form.Label>
                <Form.Select value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                  <option value="">-- Select a Barangay --</option>
                  {BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading records...</p>
        </div>
      )}

      {!loading && error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && report && barangay && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <img 
                  src={nutritionLogo} 
                  alt="Nutrition Logo" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid #198754'
                  }} 
                />
                <span className="text-muted">Backyard Gardening</span>
              </div>
              <Button variant="success" onClick={handleExportPDF}>
                <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON WITH AND WITHOUT BACKYARD GARDENING CY:{report.year}
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <Table bordered className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '20%' }}>PUROK</th>
                  <th style={{ width: '20%' }}>WITH GARDEN</th>
                  <th style={{ width: '20%' }}>WITHOUT GARDEN</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td className="text-center">{p.withGarden || 0}</td>
                    <td className="text-center">{p.withoutGarden || 0}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total.withGarden || 0}</td>
                  <td className="text-center">{report.total.withoutGarden || 0}</td>
                </tr>
              </tbody>
            </Table>

            <div className="row mt-4">
              <div className="col-6">
                <strong>CERTIFIED CORRECT:</strong> ________________<br />
                <span className="ms-4">BNS</span>
              </div>
              <div className="col-6 text-end">
                <strong>APPROVED BY:</strong> ________________<br />
                <span className="me-4">BRGY. CAPTAIN</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default BackyardGardeningReport