import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { childRecordApi } from '../../api/auth'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination } from 'react-bootstrap'
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa'

const ChildRecordsEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    targetCategory: 'Child (0–59 months)',
    fullName: '',
    ageMonths: '',
    weight: '',
    height: '',
    nutritionalStatus: '',
    recordedDate: new Date().toISOString().split('T')[0],
  })
  const [records, setRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(15)
  
  // Filter state
  const [filters, setFilters] = useState({
    barangay: '',
    purok: '',
    nutritionalStatus: '',
    ageMin: '',
    ageMax: '',
    weightMin: '',
    weightMax: '',
    heightMin: '',
    heightMax: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchTerm, records, filters])

  const fetchRecords = async () => {
    try {
      const data = await childRecordApi.getAll()
      setRecords(data)
      setFilteredRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...records]

    // Search by name only
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record => 
        record.fullName.toLowerCase().includes(search)
      )
    }

    // Apply filters
    if (filters.barangay) {
      filtered = filtered.filter(record => record.barangay === filters.barangay)
    }

    if (filters.purok) {
      filtered = filtered.filter(record => record.purok === parseInt(filters.purok))
    }

    if (filters.nutritionalStatus) {
      filtered = filtered.filter(record => record.nutritionalStatus === filters.nutritionalStatus)
    }

    if (filters.ageMin) {
      filtered = filtered.filter(record => record.ageMonths >= parseInt(filters.ageMin))
    }

    if (filters.ageMax) {
      filtered = filtered.filter(record => record.ageMonths <= parseInt(filters.ageMax))
    }

    if (filters.weightMin) {
      filtered = filtered.filter(record => record.weight >= parseFloat(filters.weightMin))
    }

    if (filters.weightMax) {
      filtered = filtered.filter(record => record.weight <= parseFloat(filters.weightMax))
    }

    if (filters.heightMin) {
      filtered = filtered.filter(record => record.height >= parseFloat(filters.heightMin))
    }

    if (filters.heightMax) {
      filtered = filtered.filter(record => record.height <= parseFloat(filters.heightMax))
    }

    setFilteredRecords(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Next/Previous page
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

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)
    setRecordsPerPage(newSize)
    setCurrentPage(1) // Reset to first page
  }

  const checkDuplicateChild = (fullName, barangay, purok, excludeId = null) => {
    return records.some(record => 
      record.fullName.toLowerCase() === fullName.toLowerCase() &&
      record.barangay === barangay &&
      record.purok === parseInt(purok) &&
      record.id !== excludeId
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate that values are not negative
      const ageMonths = parseInt(formData.ageMonths)
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)

      // Validate age is between 6 and 59 months
      if (ageMonths < 6 || ageMonths > 59) {
        setError('Age must be between 6 and 59 months')
        setLoading(false)
        return
      }

      if (weight < 0) {
        setError('Weight cannot be negative')
        setLoading(false)
        return
      }

      if (height < 0) {
        setError('Height cannot be negative')
        setLoading(false)
        return
      }

      // Check for duplicate child
      const isDuplicate = checkDuplicateChild(
        formData.fullName,
        formData.barangay,
        formData.purok,
        editingId || null
      )

      if (isDuplicate) {
        setError(`A child named "${formData.fullName}" already exists in ${formData.barangay}, Purok ${formData.purok}`)
        setLoading(false)
        return
      }

      const data = {
        ...formData,
        purok: parseInt(formData.purok),
        ageMonths: ageMonths,
        weight: weight,
        height: height,
        recordedDate: formData.recordedDate || new Date().toISOString().split('T')[0],
      }

      if (editingId) {
        await childRecordApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await childRecordApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        targetCategory: 'Child (0–59 months)',
        fullName: '',
        ageMonths: '',
        weight: '',
        height: '',
        nutritionalStatus: '',
        recordedDate: new Date().toISOString().split('T')[0],
      })
      setEditingId(null)
      fetchRecords()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error saving record'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      targetCategory: record.targetCategory,
      fullName: record.fullName,
      ageMonths: record.ageMonths,
      weight: record.weight,
      height: record.height,
      nutritionalStatus: record.nutritionalStatus,
      recordedDate: record.recordedDate ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await childRecordApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    }
  }

  // Helper function to prevent negative values and restrict age range
  const handleAgeInput = (e) => {
    const value = e.target.value
    if (value === '') {
      setFormData({ ...formData, ageMonths: '' })
      return
    }
    const numValue = parseInt(value)
    if (numValue >= 0) {
      setFormData({ ...formData, ageMonths: value })
    }
  }

  // Helper function to prevent negative values for weight and height
  const handleNonNegativeInput = (e, field) => {
    const value = e.target.value
    if (value === '' || parseFloat(value) >= 0) {
      setFormData({ ...formData, [field]: value })
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters({
      barangay: '',
      purok: '',
      nutritionalStatus: '',
      ageMin: '',
      ageMax: '',
      weightMin: '',
      weightMax: '',
      heightMin: '',
      heightMax: '',
    })
    setSearchTerm('')
    setShowFilters(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  // Render pagination items
  const renderPagination = () => {
    let items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    // Add first page button
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

    // Add last page button
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

  // Page size options
  const pageSizeOptions = [5, 10, 15, 25, 50, 100]

  return (
    <div>
      <h4 className="mb-4">Child Records (6-59 months)</h4>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Record</h6>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barangay</Form.Label>
                  <Form.Select
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    required
                  >
                    <option value="">Select Barangay</option>
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
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
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age (Months) - 6 to 59 only</Form.Label>
                  <Form.Control
                    type="number"
                    min="6"
                    max="59"
                    value={formData.ageMonths}
                    onChange={handleAgeInput}
                    required
                    placeholder="e.g., 24"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Age must be between 6 and 59 months
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (KG)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleNonNegativeInput(e, 'weight')}
                    required
                    placeholder="e.g., 11.5"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height (CM)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => handleNonNegativeInput(e, 'height')}
                    required
                    placeholder="e.g., 85.0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nutritional Status</Form.Label>
                  <Form.Select
                    value={formData.nutritionalStatus}
                    onChange={(e) => setFormData({ ...formData, nutritionalStatus: e.target.value })}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Normal">Normal</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Record Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={() => {
                setEditingId(null)
                setFormData({
                  barangay: user?.barangay || '',
                  purok: '',
                  targetCategory: 'Child (0–59 months)',
                  fullName: '',
                  ageMonths: '',
                  weight: '',
                  height: '',
                  nutritionalStatus: '',
                  recordedDate: new Date().toISOString().split('T')[0],
                })
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
                    placeholder="Search by name..."
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
        
        {/* Filter Section */}
        {showFilters && (
          <Card.Body className="bg-light border-bottom">
            <Row>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Barangay</Form.Label>
                  <Form.Select
                    value={filters.barangay}
                    onChange={(e) => handleFilterChange('barangay', e.target.value)}
                  >
                    <option value="">All</option>
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={filters.purok}
                    onChange={(e) => handleFilterChange('purok', e.target.value)}
                  >
                    <option value="">All</option>
                    {[1,2,3,4,5,6,7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Nutritional Status</Form.Label>
                  <Form.Select
                    value={filters.nutritionalStatus}
                    onChange={(e) => handleFilterChange('nutritionalStatus', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Normal">Normal</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Age Min</Form.Label>
                  <Form.Control
                    type="number"
                    min="6"
                    max="59"
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Age Max</Form.Label>
                  <Form.Control
                    type="number"
                    min="6"
                    max="59"
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Weight Min</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Min KG"
                    value={filters.weightMin}
                    onChange={(e) => handleFilterChange('weightMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Weight Max</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Max KG"
                    value={filters.weightMax}
                    onChange={(e) => handleFilterChange('weightMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Height Min</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Min CM"
                    value={filters.heightMin}
                    onChange={(e) => handleFilterChange('heightMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Height Max</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Max CM"
                    value={filters.heightMax}
                    onChange={(e) => handleFilterChange('heightMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        )}

        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Barangay</th>
                <th>Purok</th>
                <th>Name</th>
                <th>Age (mos)</th>
                <th>Weight</th>
                <th>Height</th>
                <th>Status</th>
                <th>Recorded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-3 text-muted">
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
                    <td>{record.fullName}</td>
                    <td>{record.ageMonths}</td>
                    <td>{record.weight} kg</td>
                    <td>{record.height} cm</td>
                    <td>
                      <span className={`badge ${
                        record.nutritionalStatus === 'Normal' ? 'bg-success' :
                        record.nutritionalStatus === 'Underweight' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {record.nutritionalStatus}
                      </span>
                    </td>
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
        
        {/* Pagination Footer */}
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

export default ChildRecordsEntry