// components/overall-reports/OverallVegetableSeedReport.jsx
import { useState, useEffect } from 'react'
import { vegetableSeedApi } from '../../api/reports'
import { Card, Row, Col, Form, Spinner, Table, Button, Alert } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const OverallVegetableSeedReport = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchOverallReport()
  }, [startDate, endDate])

  const fetchOverallReport = async () => {
    setLoading(true)
    setError('')
    try {
      const allRecords = await vegetableSeedApi.getAll()
      
      const dateFiltered = allRecords.filter(r => {
        const recordDate = new Date(r.recordedDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return recordDate >= start && recordDate <= end
      })
      
      const barangays = [...new Set(dateFiltered.map(r => r.barangay))].sort()
      const barangayReports = barangays.map(barangay => {
        const barangayRecords = dateFiltered.filter(r => r.barangay === barangay)
        const seedTypes = []
        barangayRecords.forEach(r => {
          if (r.seedTypes) {
            const types = r.seedTypes.split(',').map(s => s.trim())
            seedTypes.push(...types)
          }
        })
        const uniqueSeeds = [...new Set(seedTypes)]
        
        return {
          barangay,
          totalHouseholds: barangayRecords.length,
          seedTypes: uniqueSeeds.length > 0 ? uniqueSeeds.join(', ') : 'None',
          totalSeedTypes: uniqueSeeds.length
        }
      })
      
      const overallTotal = {
        totalHouseholds: barangayReports.reduce((sum, b) => sum + b.totalHouseholds, 0),
        totalSeedTypes: barangayReports.reduce((sum, b) => sum + b.totalSeedTypes, 0),
        totalBarangays: barangayReports.length
      }
      
      setReport({
        barangays: barangayReports,
        overallTotal,
        startDate,
        endDate,
        preparedBy: 'Cristine A. Macahis, MNPC',
        notedBy: 'Jehd Stephen O. Cutamora, RN'
      })
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching report')
    } finally {
      setLoading(false)
    }
  }

  const getYearDisplay = () => {
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    return startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
  }

  const handleExportPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const yearDisplay = getYearDisplay()

    const logoImg = new Image()
    logoImg.src = nutritionLogo
    doc.addImage(logoImg, 'JPEG', 14, 6, 22, 22)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Republic of the Philippines', pageWidth / 2, 14, { align: 'center' })
    doc.text('Province of Bohol', pageWidth / 2, 20, { align: 'center' })
    doc.text('Municipality of Ubay', pageWidth / 2, 26, { align: 'center' })
    doc.text('MUNICIPAL NUTRITION COUNCIL', pageWidth / 2, 32, { align: 'center' })

    doc.setFontSize(15)
    doc.text(`VEGETABLE SEEDS OVERALL REPORT CY:${yearDisplay}`, pageWidth / 2, 42, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`DATE: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, pageWidth / 2, 48, { align: 'center' })

    const body = (report.barangays || []).map((b, i) => [
      i + 1,
      b.barangay,
      b.totalHouseholds || 0,
      b.seedTypes || 'None'
    ])

    body.push([
      '', 'Total',
      report.overallTotal?.totalHouseholds || 0,
      ''
    ])

    autoTable(doc, {
      startY: 54,
      head: [['#', 'BARANGAY', 'TOTAL HOUSEHOLDS', 'SEED TYPES']],
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [220, 230, 245], textColor: 0, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { halign: 'center' },
        3: { cellWidth: 60 }
      },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    const finalY = doc.lastAutoTable.finalY + 20

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PREPARED BY:', 14, finalY)
    doc.text('NOTED BY:', pageWidth - 80, finalY)

    doc.setFont('helvetica', 'normal')
    doc.text(report.preparedBy || 'Cristine A. Macahis, MNPC', 14, finalY + 12)
    doc.text(report.notedBy || 'Jehd Stephen O. Cutamora, RN', pageWidth - 80, finalY + 12)

    doc.save(`Overall_VegetableSeed_Report_${yearDisplay}.pdf`)
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading overall report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={fetchOverallReport}>Retry</Button>
      </div>
    )
  }

  if (!report || report.barangays.length === 0) {
    return (
      <div className="text-center py-5">
        <Alert variant="info">No records found for the selected date range.</Alert>
      </div>
    )
  }

  const yearDisplay = getYearDisplay()

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <img src={nutritionLogo} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #198754' }} />
          <div>
            <h1 className="mb-0">Vegetable Seeds Overall Report</h1>
            <small className="text-muted">CY: {yearDisplay}</small>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '150px' }} />
          <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '150px' }} />
          <Button variant="success" onClick={handleExportPDF}>
            <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Barangays</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.totalBarangays || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Households</h6>
              <h2 className="mb-0 text-info">{report.overallTotal?.totalHouseholds || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Seed Types</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal?.totalSeedTypes || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="text-center bg-white border-0 pt-3">
          <div className="d-flex align-items-center justify-content-center gap-3">
            <img src={nutritionLogo} alt="Logo" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #198754' }} />
            <div>
              <div className="fw-bold">MUNICIPAL NUTRITION COUNCIL</div>
              <div className="fw-bold fs-5 text-success">VEGETABLE SEEDS OVERALL REPORT CY: {yearDisplay}</div>
              <div className="text-muted small">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</div>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="mb-0">
            <thead>
              <tr className="text-center">
                <th style={{ width: '5%' }}>#</th>
                <th>BARANGAY</th>
                <th style={{ width: '15%' }}>TOTAL HOUSEHOLDS</th>
                <th>SEED TYPES</th>
              </tr>
            </thead>
            <tbody>
              {report.barangays.map((barangay, i) => (
                <tr key={barangay.barangay}>
                  <td className="text-center">{i + 1}</td>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.totalHouseholds || 0}</td>
                  <td>{barangay.seedTypes || 'None'}</td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-center">{report.overallTotal?.totalHouseholds || 0}</td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img src={nutritionLogo} alt="Logo" style={{ width: '25px', height: '25px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #198754' }} />
            <p className="fw-bold mb-0">PREPARED BY:</p>
          </div>
          <p>{report.preparedBy || 'Cristine A. Macahis, MNPC'}</p>
        </Col>
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img src={nutritionLogo} alt="Logo" style={{ width: '25px', height: '25px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #198754' }} />
            <p className="fw-bold mb-0">NOTED BY:</p>
          </div>
          <p>{report.notedBy || 'Jehd Stephen O. Cutamora, RN'}</p>
        </Col>
      </Row>
    </div>
  )
}

export default OverallVegetableSeedReport