import { Table, Badge, Button, Modal } from 'react-bootstrap'
import { useState } from 'react'

const ReportTable = ({ reports, isAdmin, onEdit, onDelete, onApprove }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  if (!reports || reports.length === 0) {
    return <p className="text-muted text-center py-3">No reports found</p>
  }

  // Group by report ID (each report is separate)
  const groupedReports = reports.reduce((acc, report) => {
    const key = report.id
    if (!acc[key]) {
      acc[key] = {
        id: report.id,
        barangay: report.barangay,
        quarter: report.quarter,
        year: report.year,
        status: report.status,
        reportedDate: report.reportedDate,
        puroks: {},
        total6To11: 0,
        total12To59: 0,
        totalUnderweight: 0
      }
    }
    acc[key].puroks[report.purok] = {
      months6To11: report.months6To11,
      months12To59: report.months12To59,
      underweightSUW: report.underweightSUW
    }
    acc[key].total6To11 += report.months6To11
    acc[key].total12To59 += report.months12To59
    acc[key].totalUnderweight += report.underweightSUW
    return acc
  }, {})

  const handleView = (report) => {
    setSelectedReport(report)
    setShowModal(true)
  }

  return (
    <>
      <div className="table-responsive">
        <Table responsive hover striped>
          <thead>
            <tr>
              <th>Barangay</th>
              <th>Date</th>
              <th className="text-center">6-11</th>
              <th className="text-center">12-59</th>
              <th className="text-center">UW & SUW</th>
              <th className="text-center">Total</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(groupedReports).map((group) => {
              const total = group.total6To11 + group.total12To59 + group.totalUnderweight
              return (
                <tr key={group.id}>
                  <td>{group.barangay}</td>
                  <td>{new Date(group.reportedDate).toLocaleDateString()}</td>
                  <td className="text-center">{group.total6To11}</td>
                  <td className="text-center">{group.total12To59}</td>
                  <td className="text-center">{group.totalUnderweight}</td>
                  <td className="text-center fw-bold">{total}</td>
                  <td className="text-center">
                    <Badge bg={group.status === 'approved' ? 'success' : 'warning'}>
                      {group.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-1 justify-content-center flex-wrap">
                      <Button variant="info" size="sm" onClick={() => handleView(group)}>
                        View
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={() => onEdit(group)}>
                        Edit
                      </Button>
                      {isAdmin && group.status === 'pending' && (
                        <Button variant="success" size="sm" onClick={() => onApprove(group.id)}>
                          Approve
                        </Button>
                      )}
                      <Button variant="outline-danger" size="sm" onClick={() => onDelete(group.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>

      {/* View Modal - Shows ALL 7 puroks */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report Details - {selectedReport?.barangay}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Barangay:</strong> {selectedReport.barangay}
                </div>
                <div className="col-md-4">
                  <strong>Date:</strong> {new Date(selectedReport.reportedDate).toLocaleDateString()}
                </div>
                <div className="col-md-4">
                  <strong>Status:</strong>{' '}
                  <Badge bg={selectedReport.status === 'approved' ? 'success' : 'warning'}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Quarter:</strong> {selectedReport.quarter || 'N/A'}
                </div>
                <div className="col-md-6">
                  <strong>Year:</strong> {selectedReport.year || 'N/A'}
                </div>
              </div>

              {/* ALL 7 PUROKS */}
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Purok</th>
                    <th className="text-center">6-11</th>
                    <th className="text-center">12-59</th>
                    <th className="text-center">UW & SUW</th>
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                    const data = selectedReport.puroks[p] || { months6To11: 0, months12To59: 0, underweightSUW: 0 }
                    const total = data.months6To11 + data.months12To59 + data.underweightSUW
                    return (
                      <tr key={p}>
                        <td><strong>{p}</strong></td>
                        <td className="text-center">{data.months6To11}</td>
                        <td className="text-center">{data.months12To59}</td>
                        <td className="text-center">{data.underweightSUW}</td>
                        <td className="text-center fw-bold">{total}</td>
                      </tr>
                    )
                  })}
                  <tr className="table-primary fw-bold">
                    <td>TOTAL</td>
                    <td className="text-center">{selectedReport.total6To11}</td>
                    <td className="text-center">{selectedReport.total12To59}</td>
                    <td className="text-center">{selectedReport.totalUnderweight}</td>
                    <td className="text-center">{selectedReport.total6To11 + selectedReport.total12To59 + selectedReport.totalUnderweight}</td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default ReportTable