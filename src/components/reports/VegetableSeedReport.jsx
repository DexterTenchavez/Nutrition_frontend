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
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  
  // Filter states for the 3 seed type columns
  const [selectedSeed1, setSelectedSeed1] = useState('')
  const [selectedSeed2, setSelectedSeed2] = useState('')
  const [selectedSeed3, setSelectedSeed3] = useState('')

  // Get all unique seed types from records
  const getAllSeedTypes = () => {
    const seedSet = new Set()
    records.forEach(record => {
      if (record.seedTypes) {
        try {
          const seeds = typeof record.seedTypes === 'string' ? JSON.parse(record.seedTypes) : record.seedTypes
          seeds.forEach(s => {
            if (s.type) seedSet.add(s.type)
          })
        } catch (e) {}
      }
    })
    return Array.from(seedSet).sort()
  }

  const seedOptions = getAllSeedTypes()

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, startDate, endDate])

  useEffect(() => {
    if (records.length > 0) {
      // Auto-select first 3 seed types if available
      const allSeeds = getAllSeedTypes()
      if (allSeeds.length > 0 && !selectedSeed1) setSelectedSeed1(allSeeds[0])
      if (allSeeds.length > 1 && !selectedSeed2) setSelectedSeed2(allSeeds[1])
      if (allSeeds.length > 2 && !selectedSeed3) setSelectedSeed3(allSeeds[2])
    }
  }, [records])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await vegetableSeedApi.getByBarangay(barangay, 0)
      
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
      let poorFamiliesCount = 0
      const seedCounts = {}
      
      purokRecords.forEach(r => {
        poorFamiliesCount += 1
        if (r.seedTypes) {
          try {
            const seeds = typeof r.seedTypes === 'string' ? JSON.parse(r.seedTypes) : r.seedTypes
            seeds.forEach(s => {
              if (!seedCounts[s.type]) seedCounts[s.type] = 0
              seedCounts[s.type] += s.count
            })
          } catch (e) {}
        }
      })
      
      // Get counts for selected seed types
      const count1 = selectedSeed1 ? (seedCounts[selectedSeed1] || 0) : 0
      const count2 = selectedSeed2 ? (seedCounts[selectedSeed2] || 0) : 0
      const count3 = selectedSeed3 ? (seedCounts[selectedSeed3] || 0) : 0
      const subTotal = count1 + count2 + count3
      
      purokReports.push({
        purok: p,
        poorFamilies: poorFamiliesCount,
        count1: count1,
        count2: count2,
        count3: count3,
        subTotal: subTotal,
        seedTypes: seedCounts
      })
    }
    
    const total = {
      poorFamilies: purokReports.reduce((sum, p) => sum + p.poorFamilies, 0),
      count1: purokReports.reduce((sum, p) => sum + p.count1, 0),
      count2: purokReports.reduce((sum, p) => sum + p.count2, 0),
      count3: purokReports.reduce((sum, p) => sum + p.count3, 0),
      subTotal: purokReports.reduce((sum, p) => sum + p.subTotal, 0)
    }
    
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    const yearDisplay = startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
    setReport({ 
      purokReports, 
      total, 
      barangay, 
      year: yearDisplay, 
      startDate, 
      endDate,
      selectedSeed1,
      selectedSeed2,
      selectedSeed3
    })
  }

  // Re-generate report when seed selections change
  useEffect(() => {
    if (records.length > 0) {
      generateReport(records)
    }
  }, [selectedSeed1, selectedSeed2, selectedSeed3])

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
    doc.text(`DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 46)

    const body = report.purokReports.map((p) => [
      p.purok,
      p.poorFamilies || 0,
      p.count1 || 0,
      p.count2 || 0,
      p.count3 || 0,
      p.subTotal || 0
    ])

    body.push([
      'TOTAL',
      report.total.poorFamilies || 0,
      report.total.count1 || 0,
      report.total.count2 || 0,
      report.total.count3 || 0,
      report.total.subTotal || 0
    ])

    const headers = [
      ['PUROK', 'NO. OF POOR FAMILIES', 
       `NO. OF ${report.selectedSeed1 || '______'}`, 
       `NO. OF ${report.selectedSeed2 || '______'}`, 
       `NO. OF ${report.selectedSeed3 || '______'}`, 
       'SUB-TOTAL']
    ]

    autoTable(doc, {
      startY: 52,
      head: headers,
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 9, cellPadding: 4 },
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

    doc.save(`Vegetable_Seed_Report_${barangayName}_${report.year}.pdf`)
  }

  return (
    <div>
      <h4 className="mb-4">Vegetable Seed Report</h4>

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
          
          <Row className="mt-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 1</Form.Label>
                <Form.Select 
                  value={selectedSeed1} 
                  onChange={(e) => setSelectedSeed1(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 2</Form.Label>
                <Form.Select 
                  value={selectedSeed2} 
                  onChange={(e) => setSelectedSeed2(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 3</Form.Label>
                <Form.Select 
                  value={selectedSeed3} 
                  onChange={(e) => setSelectedSeed3(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
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
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <Table bordered className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '8%' }}>PUROK</th>
                  <th style={{ width: '15%' }}>NO. OF POOR FAMILIES</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed1 || '______'}</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed2 || '______'}</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed3 || '______'}</th>
                  <th style={{ width: '10%' }}>SUB-TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td className="text-center">{p.poorFamilies || 0}</td>
                    <td className="text-center">{p.count1 || 0}</td>
                    <td className="text-center">{p.count2 || 0}</td>
                    <td className="text-center">{p.count3 || 0}</td>
                    <td className="text-center">{p.subTotal || 0}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total.poorFamilies || 0}</td>
                  <td className="text-center">{report.total.count1 || 0}</td>
                  <td className="text-center">{report.total.count2 || 0}</td>
                  <td className="text-center">{report.total.count3 || 0}</td>
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