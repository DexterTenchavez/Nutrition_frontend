import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { reportApi } from '../api/auth'
import { Card, Row, Col, Form, Spinner, Table, Button } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const OverallReport = () => {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOverallReport()
  }, [year, quarter])

  const fetchOverallReport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { year }
      if (quarter) params.quarter = quarter

      const data = await reportApi.getOverallReport(params)
      setReport(data)
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // --- LOGO (top left) ---
    const logoImg = new Image()
    logoImg.src = nutritionLogo
    doc.addImage(logoImg, 'JPEG', 14, 6, 22, 22)

    // --- HEADER ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Republic of the Philippines', pageWidth / 2, 14, { align: 'center' })
    doc.text('Province of Bohol', pageWidth / 2, 20, { align: 'center' })
    doc.text('Municipality of Ubay', pageWidth / 2, 26, { align: 'center' })
    doc.text('MUNICIPAL NUTRITION COUNCIL', pageWidth / 2, 32, { align: 'center' })

    doc.setFontSize(15)
    doc.text(`VITAMIN A ${report.year}`, pageWidth / 2, 42, { align: 'center' })

    // --- TABLE ---
    const body = (report.barangays || []).map((b, i) => [
      i + 1,
      b.barangay,
      b.months6To11 || '',
      b.months12To59 || '',
      b.underweightSUW || ''
    ])

    body.push([
      '', 'Total',
      report.overallTotal?.months6To11 || 0,
      report.overallTotal?.months12To59 || 0,
      report.overallTotal?.underweightSUW || 0
    ])

    autoTable(doc, {
      startY: 48,
      head: [['#', 'BARANGAY', '6 - 11', '12 - 59', 'NO. OF CHILDREN UW & SUW']],
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [220, 230, 245], textColor: 0, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 55 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    const finalY = doc.lastAutoTable.finalY + 20

    // --- SIGNATURES ---
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PREPARED BY:', 14, finalY)
    doc.text('NOTED BY:', pageWidth - 80, finalY)

    doc.setFont('helvetica', 'normal')
    doc.text(report.preparedBy || 'Cristine A. Macahis, MNPC', 14, finalY + 12)
    doc.text(report.notedBy || 'Jehd Stephen O. Cutamora, RN', pageWidth - 80, finalY + 12)

    doc.save(`Overall_Report_${report.year}.pdf`)
  }

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-5">Access denied. Admin only.</div>
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
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchOverallReport}>Retry</button>
      </div>
    )
  }

  if (!report) {
    return <div className="text-center py-5 text-muted">No data available</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <img 
            src={nutritionLogo} 
            alt="Nutrition Logo" 
            style={{ 
              width: '50px', 
              height: '50px', 
              objectFit: 'cover',
              borderRadius: '50%',
              border: '2px solid #198754'
            }} 
          />
          <h1 className="mb-0">Overall Report - {report.year}</h1>
        </div>
        <div className="d-flex gap-2">
          <Form.Select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: '100px' }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
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
          <Button variant="success" onClick={handleExportPDF}>
            <i className="bi bi-file-pdf-fill me-2"></i>Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Barangays</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.totalBarangays || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">6-11 months</h6>
              <h2 className="mb-0 text-info">{report.overallTotal?.months6To11 || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">12-59 months</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.months12To59 || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">UW & SUW</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal?.underweightSUW || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="text-center bg-white border-0 pt-3">
          <div className="d-flex align-items-center justify-content-center gap-3">
            <img 
              src={nutritionLogo} 
              alt="Nutrition Logo" 
              style={{ 
                width: '35px', 
                height: '35px', 
                objectFit: 'cover',
                borderRadius: '50%',
                border: '2px solid #198754'
              }} 
            />
            <div>
              <div className="fw-bold">MUNICIPAL NUTRITION COUNCIL</div>
              <div className="fw-bold fs-5 text-success">VITAMIN A {report.year}</div>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="mb-0">
            <thead>
              <tr className="text-center">
                <th style={{ width: '5%' }}>#</th>
                <th>BARANGAY</th>
                <th style={{ width: '12%' }}>6 - 11</th>
                <th style={{ width: '12%' }}>12 - 59</th>
                <th style={{ width: '20%' }}>NO. OF CHILDREN UW & SUW</th>
              </tr>
            </thead>
            <tbody>
              {report.barangays && report.barangays.map((barangay, i) => (
                <tr key={barangay.barangay}>
                  <td className="text-center">{i + 1}</td>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.months6To11 || ''}</td>
                  <td className="text-center">{barangay.months12To59 || ''}</td>
                  <td className="text-center">{barangay.underweightSUW || ''}</td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-center">{report.overallTotal?.months6To11 || 0}</td>
                <td className="text-center">{report.overallTotal?.months12To59 || 0}</td>
                <td className="text-center">{report.overallTotal?.underweightSUW || 0}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Signatures */}
      <Row className="mt-4">
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img 
              src={nutritionLogo} 
              alt="Logo" 
              style={{ 
                width: '25px', 
                height: '25px', 
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1px solid #198754'
              }} 
            />
            <p className="fw-bold mb-0">PREPARED BY:</p>
          </div>
          <p>{report.preparedBy || 'Cristine A. Macahis, MNPC'}</p>
        </Col>
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img 
              src={nutritionLogo} 
              alt="Logo" 
              style={{ 
                width: '25px', 
                height: '25px', 
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1px solid #198754'
              }} 
            />
            <p className="fw-bold mb-0">NOTED BY:</p>
          </div>
          <p>{report.notedBy || 'Jehd Stephen O. Cutamora, RN'}</p>
        </Col>
      </Row>
    </div>
  )
}

export default OverallReport