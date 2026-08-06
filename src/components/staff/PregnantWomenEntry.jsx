import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { pregnantWomenApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination } from 'react-bootstrap'
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa'

const PregnantWomenEntry = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: '',
    womanName: '',
    weight: '',
    height: '',
    bmi: '',
    bmiCategory: '',
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(15)
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    purok: '',
    bmiCategory: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (selectedBarangay) {
      fetchRecords()
    }
  }, [selectedBarangay, selectedDate])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchTerm, records, filters])

  const fetchRecords = async () => {
  try {
    // Use year 0 to get all records
    const data = await pregnantWomenApi.getByBarangay(selectedBarangay, 0)
    setRecords(data)
    setFilteredRecords(data)
  } catch (error) {
    console.error('Error fetching records:', error)
  }
}

  const applyFiltersAndSearch = () => {
    let filtered = [...records]

    // Search by woman name only
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record => 
        record.womanName?.toLowerCase().includes(search)
      )
    }

    // Apply filters
    if (filters.purok) {
      filtered = filtered.filter(record => record.purok === parseInt(filters.purok))
    }

    if (filters.bmiCategory) {
      filtered = filtered.filter(record => record.bmiCategory === filters.bmiCategory)
    }

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }

  // Calculate BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null
    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    return Math.round(bmi * 10) / 10 // Round to 1 decimal
  }

  // Determine BMI Category
  const getBMICategory = (bmi) => {
    if (!bmi) return ''
    if (bmi < 18.5) return 'Low BMI'
    if (bmi >= 18.5 && bmi <= 24.9) return 'Normal BMI'
    if (bmi >= 25 && bmi <= 29.9) return 'High BMI'
    return 'High BMI' // 30 and above
  }

  // Get BMI color
  const getBMIColor = (category) => {
    switch(category) {
      case 'Low BMI': return 'danger'
      case 'Normal BMI': return 'success'
      case 'High BMI': return 'warning'
      default: return 'secondary'
    }
  }

  // Handle weight/height change and auto-calculate BMI
  const handleWeightHeightChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value }
    if (field === 'weight' || field === 'height') {
      const weight = field === 'weight' ? parseFloat(value) : parseFloat(formData.weight)
      const height = field === 'height' ? parseFloat(value) : parseFloat(formData.height)
      const bmi = calculateBMI(weight, height)
      if (bmi !== null && !isNaN(bmi)) {
        updatedForm.bmi = bmi.toString()
        updatedForm.bmiCategory = getBMICategory(bmi)
      } else {
        updatedForm.bmi = ''
        updatedForm.bmiCategory = ''
      }
    }
    setFormData(updatedForm)
  }

  const handleNonNegativeInput = (e, field) => {
    const value = e.target.value
    if (value === '' || parseFloat(value) >= 0) {
      handleWeightHeightChange(field, value)
    }
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
    setCurrentPage(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const year = new Date(selectedDate).getFullYear()
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)
      const bmi = calculateBMI(weight, height)
      
      const data = {
        ...formData,
        purok: parseInt(formData.purok),
        womanName: formData.womanName,
        weight: weight,
        height: height,
        bmi: bmi,
        bmiCategory: getBMICategory(bmi),
        year: year,
        recordedDate: selectedDate
      }

      if (editingId) {
        await pregnantWomenApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await pregnantWomenApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: '',
        womanName: '',
        weight: '',
        height: '',
        bmi: '',
        bmiCategory: '',
        recordedDate: new Date().toISOString().split('T')[0],
        recordedBy: user?.username || ''
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
    const formattedDate = record.recordedDate ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0]
    
    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      womanName: record.womanName || '',
      weight: record.weight,
      height: record.height,
      bmi: record.bmi,
      bmiCategory: record.bmiCategory || '',
      recordedDate: formattedDate,
      recordedBy: record.recordedBy || user?.username || ''
    })
    setSelectedDate(formattedDate)
    setEditingId(record.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await pregnantWomenApi.delete(id)
      fetchRecords()
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
      bmiCategory: '',
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

  return (
    <div>
      <h4 className="mb-4">Pregnant Women BMI Report</h4>

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
        <Col md={4}>
          <Form.Group>
            <Form.Label>Record Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
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
                  <Form.Label>Woman's Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.womanName}
                    onChange={(e) => setFormData({ ...formData, womanName: e.target.value })}
                    required
                    placeholder="Enter woman's full name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (KG)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleNonNegativeInput(e, 'weight')}
                    required
                    placeholder="e.g., 65.5"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Height (CM)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => handleNonNegativeInput(e, 'height')}
                    required
                    placeholder="e.g., 165.0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>BMI</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.bmi || 'Auto-calculated'}
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>BMI Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.bmiCategory || 'Auto-calculated'}
                    readOnly
                    disabled
                    className={`text-${formData.bmiCategory ? getBMIColor(formData.bmiCategory) : 'secondary'}`}
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
                  womanName: '',
                  weight: '',
                  height: '',
                  bmi: '',
                  bmiCategory: '',
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
                    placeholder="Search by woman's name..."
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
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>BMI Category</Form.Label>
                  <Form.Select
                    value={filters.bmiCategory}
                    onChange={(e) => handleFilterChange('bmiCategory', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Low BMI">Low BMI</option>
                    <option value="Normal BMI">Normal BMI</option>
                    <option value="High BMI">High BMI</option>
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
                <th>Woman's Name</th>
                <th>Weight (KG)</th>
                <th>Height (CM)</th>
                <th>BMI</th>
                <th>Category</th>
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
                    <td>{record.womanName}</td>
                    <td>{record.weight}</td>
                    <td>{record.height}</td>
                    <td>{record.bmi}</td>
                    <td>
                      <span className={`badge bg-${getBMIColor(record.bmiCategory)}`}>
                        {record.bmiCategory || 'N/A'}
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

export default PregnantWomenEntry