import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { vegetableSeedApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination } from 'react-bootstrap'
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa'

const VegetableSeedEntry = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    householdName: '',
    seedTypes: [{ type: '', count: 0 }],
    recordedDate: new Date().toISOString().split('T')[0],
    recordedBy: user?.username || ''
  })
  const [records, setRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [selectedBarangay, setSelectedBarangay] = useState(user?.barangay || '')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(15)
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    purok: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (selectedBarangay) {
      fetchRecords()
    }
  }, [selectedBarangay, selectedDate, refreshTrigger])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchTerm, records, filters])

  const fetchRecords = async () => {
    try {
      const data = await vegetableSeedApi.getByBarangay(selectedBarangay, 0)
      setRecords(data)
      setFilteredRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...records]

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record => 
        record.householdName?.toLowerCase().includes(search)
      )
    }

    if (filters.purok) {
      filtered = filtered.filter(record => record.purok === parseInt(filters.purok))
    }

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }

  const addSeedType = () => {
    setFormData({
      ...formData,
      seedTypes: [...formData.seedTypes, { type: '', count: 0 }]
    })
  }

  const removeSeedType = (index) => {
    if (formData.seedTypes.length <= 1) return
    const updated = [...formData.seedTypes]
    updated.splice(index, 1)
    setFormData({ ...formData, seedTypes: updated })
  }

  const updateSeedType = (index, field, value) => {
    const updated = [...formData.seedTypes]
    if (field === 'count') {
      updated[index].count = parseInt(value) || 0
    } else {
      updated[index].type = value
    }
    setFormData({ ...formData, seedTypes: updated })
  }

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)
    setRecordsPerPage(newSize)
    setCurrentPage(1)
  }

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Filter out empty seed types
      const filledSeedTypes = formData.seedTypes.filter(st => st.type.trim() !== '')
      const seedTypesJson = JSON.stringify(filledSeedTypes)
      
      // USE formData.recordedDate, NOT selectedDate
      const year = new Date(formData.recordedDate).getFullYear()
      
      const data = {
        barangay: formData.barangay,
        purok: parseInt(formData.purok),
        householdName: formData.householdName,
        seedTypes: seedTypesJson,
        year: year,
        recordedDate: formData.recordedDate, // ✅ Use formData.recordedDate
        recordedBy: formData.recordedBy || user?.username || ''
      }

      console.log('Saving with date:', formData.recordedDate) // Debug log

      if (editingId) {
        await vegetableSeedApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await vegetableSeedApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        householdName: '',
        seedTypes: [{ type: '', count: 0 }],
        recordedDate: new Date().toISOString().split('T')[0],
        recordedBy: user?.username || ''
      })
      setEditingId(null)
      setTimeout(() => refreshData(), 300)
    } catch (error) {
      console.error('Error:', error.response?.data)
      const errorMsg = error.response?.data?.message || error.message || 'Error saving record'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    const formattedDate = record.recordedDate ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0]
    
    let seedTypes = [{ type: '', count: 0 }]
    if (record.seedTypes) {
      try {
        const parsed = typeof record.seedTypes === 'string' ? JSON.parse(record.seedTypes) : record.seedTypes
        if (parsed && parsed.length > 0) {
          seedTypes = parsed
        }
      } catch (e) {
        seedTypes = [{ type: '', count: 0 }]
      }
    }
    
    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      householdName: record.householdName || '',
      seedTypes: seedTypes,
      recordedDate: formattedDate,
      recordedBy: record.recordedBy || user?.username || ''
    })
    setSelectedDate(formattedDate)
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await vegetableSeedApi.delete(id)
      setSuccess('Record deleted successfully!')
      setTimeout(() => refreshData(), 300)
    } catch (error) {
      alert('Error deleting record')
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters({
      purok: '',
    })
    setSearchTerm('')
    setShowFilters(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  const renderPagination = () => {
    let items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      )
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />)
      }
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => paginate(number)}
        >
          {number}
        </Pagination.Item>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />)
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      )
    }

    return items
  }

  const pageSizeOptions = [5, 10, 15, 25, 50, 100]

  const renderSeedTypes = (record) => {
    let seedTypes = []
    try {
      seedTypes = typeof record.seedTypes === 'string' 
        ? JSON.parse(record.seedTypes) 
        : record.seedTypes || []
    } catch (e) {
      seedTypes = []
    }
    return seedTypes.length > 0 ? (
      seedTypes.map((s, i) => (
        <span key={i} className="badge bg-info me-1">
          {s.type} ({s.count})
        </span>
      ))
    ) : <span className="text-muted">No seeds</span>
  }

  return (
    <div>
      <h4 className="mb-4">Poor Families Given Vegetable Seeds</h4>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Barangay</Form.Label>
            <Form.Select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="">Select Barangay</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Entry</h6>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    required
                  >
                    <option value="">Select Purok</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Household Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.householdName}
                    onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
                    required
                    placeholder="Enter household name"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Record Date Field - INSIDE the form */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Record Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => {
                      console.log('Date selected:', e.target.value) // Debug log
                      setFormData({ ...formData, recordedDate: e.target.value })
                    }}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Seedlings Given</h6>
            {formData.seedTypes.map((seed, index) => (
              <Row key={index} className="mb-2 align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Seed Type {index + 1}</Form.Label>
                    <Form.Control
                      type="text"
                      value={seed.type}
                      onChange={(e) => updateSeedType(index, 'type', e.target.value)}
                      placeholder="e.g., Eggplant, Tomato, Pechay"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Count</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={seed.count}
                      onChange={(e) => updateSeedType(index, 'count', e.target.value)}
                      placeholder="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') {
                          e.preventDefault()
                        }
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeSeedType(index)}
                    disabled={formData.seedTypes.length <= 1}
                  >
                    ×
                  </Button>
                </Col>
              </Row>
            ))}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={addSeedType}
              className="mb-3"
            >
              + Add Seed Type
            </Button>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={() => {
                setEditingId(null)
                setFormData({
                  barangay: user?.barangay || '',
                  purok: '',
                  householdName: '',
                  seedTypes: [{ type: '', count: 0 }],
                  recordedDate: new Date().toISOString().split('T')[0],
                  recordedBy: user?.username || ''
                })
                setSelectedDate(new Date().toISOString().split('T')[0])
              }}>
                Cancel
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h6 className="mb-0">Records ({filteredRecords.length} total)</h6>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative w-100">
                  <Form.Control
                    type="text"
                    placeholder="Search by household name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pe-5"
                  />
                  {searchTerm && (
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y text-decoration-none p-0 me-2"
                      onClick={clearSearch}
                      style={{ color: '#6c757d' }}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </div>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={refreshData}
                  className="ms-1"
                  title="Refresh records"
                >
                  🔄
                </Button>
                <Button 
                  variant={showFilters ? "primary" : "outline-secondary"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter /> Filters
                </Button>
                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <Button variant="danger" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>
        
        {showFilters && (
          <Card.Body className="bg-light border-bottom">
            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={filters.purok}
                    onChange={(e) => handleFilterChange('purok', e.target.value)}
                  >
                    <option value="">All Puroks</option>
                    {[1,2,3,4,5,6,7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        )}

        <Card.Body className="p-0">
          <Table responsive hover className="mb-0" size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Barangay</th>
                <th>Purok</th>
                <th>Household Name</th>
                <th>Seeds Given</th>
                <th>Recorded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-3 text-muted">
                    {searchTerm || Object.values(filters).some(v => v) 
                      ? 'No records found matching your filters' 
                      : 'No records found'}
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{indexOfFirstRecord + index + 1}</td>
                    <td>{record.barangay}</td>
                    <td>Purok {record.purok}</td>
                    <td>{record.householdName}</td>
                    <td>{renderSeedTypes(record)}</td>
                    <td>{record.recordedDate ? new Date(record.recordedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(record)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" className="ms-1" onClick={() => handleDelete(record.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
        
        {filteredRecords.length > 0 && (
          <Card.Footer>
            <Row className="align-items-center">
              <Col md={4} className="text-muted">
                Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
              </Col>
              <Col md={4} className="d-flex justify-content-center">
                <Pagination className="mb-0">
                  <Pagination.Prev 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                  />
                  {renderPagination()}
                  <Pagination.Next 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Col>
              <Col md={4} className="d-flex justify-content-end align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '14px' }}>Rows per page:</span>
                <Form.Select 
                  value={recordsPerPage}
                  onChange={handlePageSizeChange}
                  style={{ width: '80px', display: 'inline-block' }}
                  size="sm"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>
    </div>
  )
}

export default VegetableSeedEntry