import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { vegetableSeedApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const VegetableSeedReport = () => {
  const { user } = useAuth()
  const [barangay, setBarangay] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, year])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await vegetableSeedApi.getByBarangay(barangay, year)
      setRecords(data)
      generateReport(data)
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
      let poorFamiliesCount = 0
      const seedTypes = {}
      purokRecords.forEach(r => {
        poorFamiliesCount += 1
        if (r.seedTypes) {
          try {
            const seeds = typeof r.seedTypes === 'string' ? JSON.parse(r.seedTypes) : r.seedTypes
            seeds.forEach(s => {
              if (!seedTypes[s.type]) seedTypes[s.type] = 0
              seedTypes[s.type] += s.count
            })
          } catch (e) {}
        }
      })
      const seedEntries = Object.entries(seedTypes)
      const subTotal = seedEntries.reduce((sum, [_, count]) => sum + count, 0)
      purokReports.push({
        purok: p,
        poorFamilies: poorFamiliesCount,
        seedTypes: seedEntries,
        subTotal: subTotal
      })
    }
    const total = {
      poorFamilies: purokReports.reduce((sum, p) => sum + p.poorFamilies, 0),
      subTotal: purokReports.reduce((sum, p) => sum + p.subTotal, 0)
    }
    setReport({ purokReports, total, barangay, year })
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
    doc.text('CONSOLIDATED REPORT ON POOR FAMILIES', pageWidth / 2, 18, { align: 'center' })
    doc.text(`GIVEN VEGETABLE SEEDS CY.${report.year}`, pageWidth / 2, 26, { align: 'center' })

    doc.setFontSize(11)
    doc.text(`BARANGAY: ${barangayName}`, 14, 38)

    const body = report.purokReports.map((p) => {
      const seedDisplay = p.seedTypes.map(([type, count]) => `${type}(${count})`).join(', ') || 'None'
      return [
        p.purok,
        p.poorFamilies || 0,
        seedDisplay,
        p.subTotal || 0
      ]
    })

    body.push([
      'TOTAL',
      report.total.poorFamilies || 0,
      '',
      report.total.subTotal || 0
    ])

    autoTable(doc, {
      startY: 44,
      head: [['PUROK', 'NO. OF POOR FAMILIES', 'SEEDLINGS GIVEN', 'SUB-TOTAL']],
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineWidth: 0.3 },
      bodyStyles: { lineWidth: 0.3 },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold' }, 2: { halign: 'left' } }
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

    doc.save(`Vegetable_Seed_Report_${barangayName}_${report.year}.pdf`)
  }

  return (
    <div>
      <h4 className="mb-4">Vegetable Seed Report</h4>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
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
            <Col md={6}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
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
                <span className="text-muted">Vegetable Seed Report</span>
              </div>
              <Button variant="success" onClick={handleExportPDF}>
                <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON POOR FAMILIES GIVEN VEGETABLE SEEDS CY.{report.year}
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
            </div>

            <Table bordered className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '10%' }}>PUROK</th>
                  <th style={{ width: '20%' }}>NO. OF POOR FAMILIES</th>
                  <th style={{ width: '50%' }}>SEEDLINGS GIVEN</th>
                  <th style={{ width: '10%' }}>SUB-TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td className="text-center">{p.poorFamilies || 0}</td>
                    <td>
                      {p.seedTypes.map(([type, count]) => (
                        <span key={type} className="badge bg-info me-1">
                          {type} ({count})
                        </span>
                      ))}
                      {p.seedTypes.length === 0 && 'None'}
                    </td>
                    <td className="text-center">{p.subTotal || 0}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total.poorFamilies || 0}</td>
                  <td></td>
                  <td className="text-center">{report.total.subTotal || 0}</td>
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

export default VegetableSeedReport