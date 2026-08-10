import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { animalDispersalApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const AnimalDispersalReport = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const userBarangay = user?.barangay || ''
  
  const [barangay, setBarangay] = useState(isAdmin ? '' : userBarangay)
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
      const data = await animalDispersalApi.getByBarangay(barangay, 0)
      
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
        householdsReceived: purokRecords.length,
        chickenMale: purokRecords.reduce((sum, r) => sum + (r.chickenMale || 0), 0),
        chickenFemale: purokRecords.reduce((sum, r) => sum + (r.chickenFemale || 0), 0),
        pigMale: purokRecords.reduce((sum, r) => sum + (r.pigMale || 0), 0),
        pigFemale: purokRecords.reduce((sum, r) => sum + (r.pigFemale || 0), 0),
        goatMale: purokRecords.reduce((sum, r) => sum + (r.goatMale || 0), 0),
        goatFemale: purokRecords.reduce((sum, r) => sum + (r.goatFemale || 0), 0),
        cowMale: purokRecords.reduce((sum, r) => sum + (r.cowMale || 0), 0),
        cowFemale: purokRecords.reduce((sum, r) => sum + (r.cowFemale || 0), 0),
        carabaoMale: purokRecords.reduce((sum, r) => sum + (r.carabaoMale || 0), 0),
        carabaoFemale: purokRecords.reduce((sum, r) => sum + (r.carabaoFemale || 0), 0)
      })
    }
    const total = {
      householdsReceived: purokReports.reduce((sum, p) => sum + p.householdsReceived, 0),
      chickenMale: purokReports.reduce((sum, p) => sum + p.chickenMale, 0),
      chickenFemale: purokReports.reduce((sum, p) => sum + p.chickenFemale, 0),
      pigMale: purokReports.reduce((sum, p) => sum + p.pigMale, 0),
      pigFemale: purokReports.reduce((sum, p) => sum + p.pigFemale, 0),
      goatMale: purokReports.reduce((sum, p) => sum + p.goatMale, 0),
      goatFemale: purokReports.reduce((sum, p) => sum + p.goatFemale, 0),
      cowMale: purokReports.reduce((sum, p) => sum + p.cowMale, 0),
      cowFemale: purokReports.reduce((sum, p) => sum + p.cowFemale, 0),
      carabaoMale: purokReports.reduce((sum, p) => sum + p.carabaoMale, 0),
      carabaoFemale: purokReports.reduce((sum, p) => sum + p.carabaoFemale, 0)
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
    doc.text('HOUSEHOLD WITH MALNOURISHED', pageWidth / 2, 26, { align: 'center' })
    doc.text(`CHILDREN RECEIVED ANIMAL DISPERSAL ${report.year}`, pageWidth / 2, 34, { align: 'center' })

    doc.setFontSize(11)
    doc.text(`BARANGAY: ${barangayName}`, 14, 46)
    doc.text(`DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 54)

    const body = report.purokReports.map((p) => [
      p.purok,
      p.householdsReceived || 0,
      p.chickenMale || '', p.chickenFemale || '',
      p.pigMale || '', p.pigFemale || '',
      p.goatMale || '', p.goatFemale || '',
      p.cowMale || '', p.cowFemale || '',
      p.carabaoMale || '', p.carabaoFemale || '',
      ''
    ])

    body.push([
      'TOTAL',
      report.total.householdsReceived || 0,
      report.total.chickenMale || '', report.total.chickenFemale || '',
      report.total.pigMale || '', report.total.pigFemale || '',
      report.total.goatMale || '', report.total.goatFemale || '',
      report.total.cowMale || '', report.total.cowFemale || '',
      report.total.carabaoMale || '', report.total.carabaoFemale || '',
      ''
    ])

    autoTable(doc, {
      startY: 60,
      head: [
        ['PUROK', 'Households Received', 'Chicken M', 'Chicken F', 'Pig M', 'Pig F', 'Goat M', 'Goat F', 'Cow M', 'Cow F', 'Carabao M', 'Carabao F', 'Signature']
      ],
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 8, cellPadding: 3 },
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

    doc.save(`Animal_Dispersal_Report_${barangayName}_${report.year}.pdf`)
  }

  return (
    <div>
      <h4 className="mb-4">Animal Dispersal Report</h4>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Barangay</Form.Label>
                <Form.Select 
                  value={barangay} 
                  onChange={(e) => setBarangay(e.target.value)}
                  disabled={!isAdmin}
                >
                  <option value="">-- Select a Barangay --</option>
                  {BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Form.Select>
                {!isAdmin && (
                  <Form.Text className="text-muted">
                    Showing records for your barangay: <strong>{userBarangay}</strong>
                  </Form.Text>
                )}
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
                <span className="text-muted">Animal Dispersal Report</span>
              </div>
              <Button variant="success" onClick={handleExportPDF}>
                <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON HOUSEHOLD WITH MALNOURISHED CHILDREN RECEIVED ANIMAL DISPERSAL {report.year}
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <Table bordered className="mb-4" size="sm">
              <thead>
                <tr className="text-center">
                  <th rowSpan="2">PUROK</th>
                  <th rowSpan="2">Households Received</th>
                  <th colSpan="2">Chicken</th>
                  <th colSpan="2">Pig</th>
                  <th colSpan="2">Goat</th>
                  <th colSpan="2">Cow</th>
                  <th colSpan="2">Carabao</th>
                  <th rowSpan="2">Signature</th>
                </tr>
                <tr className="text-center">
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td>{p.householdsReceived || 0}</td>
                    <td>{p.chickenMale || 0}</td>
                    <td>{p.chickenFemale || 0}</td>
                    <td>{p.pigMale || 0}</td>
                    <td>{p.pigFemale || 0}</td>
                    <td>{p.goatMale || 0}</td>
                    <td>{p.goatFemale || 0}</td>
                    <td>{p.cowMale || 0}</td>
                    <td>{p.cowFemale || 0}</td>
                    <td>{p.carabaoMale || 0}</td>
                    <td>{p.carabaoFemale || 0}</td>
                    <td></td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td>{report.total.householdsReceived || 0}</td>
                  <td>{report.total.chickenMale || 0}</td>
                  <td>{report.total.chickenFemale || 0}</td>
                  <td>{report.total.pigMale || 0}</td>
                  <td>{report.total.pigFemale || 0}</td>
                  <td>{report.total.goatMale || 0}</td>
                  <td>{report.total.goatFemale || 0}</td>
                  <td>{report.total.cowMale || 0}</td>
                  <td>{report.total.cowFemale || 0}</td>
                  <td>{report.total.carabaoMale || 0}</td>
                  <td>{report.total.carabaoFemale || 0}</td>
                  <td></td>
                </tr>
              </tbody>
            </Table>

            <div className="row mt-3">
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

export default AnimalDispersalReport