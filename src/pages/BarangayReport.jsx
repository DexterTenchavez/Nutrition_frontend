import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reportApi } from '../api/auth'
import { Card, Spinner, Table, Button, Alert, Form } from 'react-bootstrap'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BARANGAYS = [
  "Achila", "Bay-ang", "Benliw", "Biabas", "Bongbong", "Bood",
  "Buenavista", "Bulilis", "Cagting", "Calanggaman", "California",
  "Camali-an", "Camambugan", "Casale", "Cuya", "Fatima", "Gabi",
  "Gov. Boyles", "Guintabo-an", "Hambabauran", "Humayhumay",
  "Iiihan", "Imelda", "Juagdan", "Katarungan", "Lomangog",
  "Los Angeles", "Pag-asa", "Pangpang", "Poblacion",
  "San Francisco", "San Isidro", "San Pascual", "San Vicente",
  "Sentinela", "Sinandigan", "Tapal", "Tapon", "Tintinan",
  "Tipolo", "Tubog", "Tuboran", "Union", "Villa Teresita"
]

const BarangayReport = () => {
  const [name, setName] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (name) {
      fetchBarangayReport(name)
    }
  }, [name])

  const fetchBarangayReport = async (barangayName) => {
    setLoading(true)
    setError('')
    setReport(null)

    try {
      const data = await reportApi.getBarangayReport(barangayName)
      setReport(data)
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error fetching report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const year = report.year || '2025'
    const barangayName = (report.barangay || name).toUpperCase()

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CONSOLIDATED REPORT ON GIVEN', pageWidth / 2, 18, { align: 'center' })
    doc.text(`VITAMIN A SUPPLEMENTARY C.Y. ${year}`, pageWidth / 2, 26, { align: 'center' })

    // Barangay line
    doc.setFontSize(11)
    doc.text(`BARANGAY: ${barangayName}`, 14, 38)

    // Table rows: purok 1-7 + total
    const body = (report.purokReports || []).map((p) => [
      p.purok,
      p.months6To11 || '',
      p.months12To59 || '',
      p.underweightSUW || ''
    ])

    body.push([
      'TOTAL',
      report.total?.months6To11 || 0,
      { content: `OVERALL TOTAL: ${report.total?.grandTotal || 0}`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }
    ])

    autoTable(doc, {
      startY: 44,
      head: [['PUROK', '6 - 11 MONTHS', '12 - 59 MONTHS', 'UNDERWEIGHT\nAND SUW']],
      body,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineWidth: 0.3 },
      bodyStyles: { lineWidth: 0.3 },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } }
    })

    const finalY = doc.lastAutoTable.finalY + 25

    // Signature lines
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFIED CORRECT:', 14, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', 60, finalY)
    doc.text(report.certifiedCorrect || 'BNS', 65, finalY + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('APPROVED BY:', pageWidth - 80, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('________________', pageWidth - 45, finalY)
    doc.text(report.approvedBy || 'Brgy. Captain', pageWidth - 45, finalY + 6)

    doc.save(`Vitamin_A_Report_${barangayName}_${year}.pdf`)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Barangay Report</h1>
        <Button as={Link} to="/dashboard" variant="secondary">
          Back to Dashboard
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Select Barangay</Form.Label>
            <Form.Select value={name} onChange={(e) => setName(e.target.value)}>
              <option value="">-- Select a Barangay --</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading barangay report for {name}...</p>
        </div>
      )}

      {!loading && error && (
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {!loading && !error && report && (
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-end mb-3">
              <Button variant="success" onClick={handleExportPDF}>
                Export as PDF
              </Button>
            </div>

            <div className="text-center mb-4">
              <h4 className="text-uppercase fw-bold mb-1">
                Consolidated Report on Given Vitamin A Supplementary C.Y. {report.year || '2025'}
              </h4>
              <p className="mb-0"><strong>BARANGAY:</strong> {(report.barangay || name).toUpperCase()}</p>
            </div>

            <Table bordered className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '15%' }}>PUROK</th>
                  <th style={{ width: '20%' }}>6 - 11 MONTHS</th>
                  <th style={{ width: '20%' }}>12 - 59 MONTHS</th>
                  <th style={{ width: '20%' }}>UNDERWEIGHT<br />AND SUW</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports?.map((purok) => (
                  <tr key={purok.purok}>
                    <td>{purok.purok}</td>
                    <td className="text-center">{purok.months6To11 || ''}</td>
                    <td className="text-center">{purok.months12To59 || ''}</td>
                    <td className="text-center">{purok.underweightSUW || ''}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total?.months6To11 || 0}</td>
                  <td className="text-center" colSpan={2}>
                    OVERALL TOTAL: {report.total?.grandTotal || 0}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="row mt-5">
              <div className="col-6">
                <strong>CERTIFIED CORRECT:</strong> ________________<br />
                <span className="ms-4">{report.certifiedCorrect || 'BNS'}</span>
              </div>
              <div className="col-6 text-end">
                <strong>APPROVED BY:</strong> ________________<br />
                <span className="me-4">{report.approvedBy || 'Brgy. Captain'}</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default BarangayReport