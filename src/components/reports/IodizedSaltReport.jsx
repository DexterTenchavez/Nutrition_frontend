import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { iodizedSaltApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const IodizedSaltReport = () => {
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
      const data = await iodizedSaltApi.getByBarangay(barangay)
      
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
      purokRecords.forEach((r, index) => {
        purokReports.push({
          purok: p,
          storeName: r.storeName || '',
          fineSaltFidel: r.fineSaltFidel ? '✓' : '',
          fineSaltUFC: r.fineSaltUFC ? '✓' : '',
          fineSaltPacificBay: r.fineSaltPacificBay ? '✓' : '',
          fineSaltOthers: r.fineSaltOthers || '',
          rockSaltAtlantic: r.rockSaltAtlantic ? '✓' : '',
          rockSaltFidel: r.rockSaltFidel ? '✓' : '',
          rockSaltLasap: r.rockSaltLasap ? '✓' : '',
          rockSaltPagAsa: r.rockSaltPagAsa ? '✓' : '',
          rockSaltJay: r.rockSaltJay ? '✓' : '',
          rockSaltOthers: r.rockSaltOthers || '',
          oilUFC: r.oilUFC ? '✓' : '',
          oilJolly: r.oilJolly ? '✓' : '',
          oilOthers: r.oilOthers || '',
          recordedDate: r.recordedDate
        })
      })
    }
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    const yearDisplay = startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
    setReport({ purokReports, barangay, year: yearDisplay, startDate, endDate })
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
    doc.text('MASTERLIST OF SARI-SARI STORES', pageWidth / 2, 18, { align: 'center' })
    doc.text('(RETAIL) SELLING IODIZED SALT', pageWidth / 2, 26, { align: 'center' })

    doc.setFontSize(11)
    doc.text(`BARANGAY: ${barangayName}`, 14, 38)
    doc.text(`DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 46)

    const body = report.purokReports.map((r, index) => [
      index + 1,
      r.purok,
      r.storeName,
      r.fineSaltFidel || '',
      r.fineSaltUFC || '',
      r.fineSaltPacificBay || '',
      r.fineSaltOthers || '',
      r.rockSaltAtlantic || '',
      r.rockSaltFidel || '',
      r.rockSaltLasap || '',
      r.rockSaltPagAsa || '',
      r.rockSaltJay || '',
      r.rockSaltOthers || '',
      r.oilUFC || '',
      r.oilJolly || '',
      r.oilOthers || ''
    ])

    autoTable(doc, {
      startY: 52,
      head: [
        ['#', 'PUROK', 'Store Name', 'FIDEL', 'UFC', 'PACIFIC BAY', 'OTHERS', 
         'ATLANTIC', 'FIDEL', 'LASAP', 'PAG-ASA', 'JAY', 'OTHERS',
         'UFC', 'JOLLY', 'OTHERS']
      ],
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineWidth: 0.3 },
      bodyStyles: { lineWidth: 0.3 },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'left' } }
    })

    const finalY = doc.lastAutoTable.finalY + 25

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Prepared by:', 14, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', 60, finalY)
    doc.text('BHW', 65, finalY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Noted by:', 14, finalY + 14)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', 60, finalY + 14)
    doc.text('BNAO', 65, finalY + 20)

    doc.setFont('helvetica', 'bold')
    doc.text('Approved by:', pageWidth - 80, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', pageWidth - 45, finalY)
    doc.text('BNC CHAIRMAN', pageWidth - 45, finalY + 6)

    doc.save(`Iodized_Salt_Report_${barangayName}_${report.year}.pdf`)
  }

  return (
    <div>
      <h4 className="mb-4">Iodized Salt Stores Report</h4>

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
                <span className="text-muted">Iodized Salt Stores</span>
              </div>
              <Button variant="success" onClick={handleExportPDF}>
                <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                MASTERLIST OF SARI-SARI STORES (RETAIL) SELLING IODIZED SALT
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <div className="table-responsive">
              <Table bordered className="mb-4" size="sm">
                <thead>
                  <tr className="text-center">
                    <th rowSpan="2">#</th>
                    <th rowSpan="2">PUROK</th>
                    <th rowSpan="2">Store Name</th>
                    <th colSpan="4">FINE IODIZED SALT</th>
                    <th colSpan="6">ROCK SALT (COARSE) IODIZED SALT</th>
                    <th colSpan="3">VIT. A FORTIFIED COOKING OIL</th>
                  </tr>
                  <tr className="text-center">
                    <th>FIDEL</th><th>UFC</th><th>PACIFIC BAY</th><th>OTHERS</th>
                    <th>ATLANTIC</th><th>FIDEL</th><th>LASAP</th><th>PAG-ASA</th><th>JAY</th><th>OTHERS</th>
                    <th>UFC</th><th>JOLLY</th><th>OTHERS</th>
                  </tr>
                </thead>
                <tbody>
                  {report.purokReports.map((r, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{r.purok}</td>
                      <td>{r.storeName}</td>
                      <td>{r.fineSaltFidel}</td>
                      <td>{r.fineSaltUFC}</td>
                      <td>{r.fineSaltPacificBay}</td>
                      <td>{r.fineSaltOthers}</td>
                      <td>{r.rockSaltAtlantic}</td>
                      <td>{r.rockSaltFidel}</td>
                      <td>{r.rockSaltLasap}</td>
                      <td>{r.rockSaltPagAsa}</td>
                      <td>{r.rockSaltJay}</td>
                      <td>{r.rockSaltOthers}</td>
                      <td>{r.oilUFC}</td>
                      <td>{r.oilJolly}</td>
                      <td>{r.oilOthers}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="row mt-3">
              <div className="col-4">
                <strong>Prepared by:</strong> ________________<br />
                <span className="ms-4">BHW</span>
              </div>
              <div className="col-4">
                <strong>Noted by:</strong> ________________<br />
                <span className="ms-4">BNAO</span>
              </div>
              <div className="col-4 text-end">
                <strong>Approved by:</strong> ________________<br />
                <span className="me-4">BNC CHAIRMAN</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default IodizedSaltReport