import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDebugInfo(null)
    setLoading(true)

    console.log('🔵 Login attempt started...')
    console.log('📝 Form data:', { 
      username: formData.username, 
      password: '***hidden***' 
    })
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000')

    try {
      const result = await login(formData)
      
      console.log('📦 Login result:', result)

      if (result.success) {
        console.log('✅ Login successful! Redirecting to dashboard...')
        navigate('/dashboard')
      } else {
        console.log('❌ Login failed:', result.error)
        setError(result.error)
        setDebugInfo({
          error: result.error,
          timestamp: new Date().toISOString(),
          apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
        })
      }
    } catch (error) {
      console.error('💥 Unexpected error during login:', error)
      setError('An unexpected error occurred. Check console for details.')
      setDebugInfo({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
      console.log('🏁 Login process completed')
    }
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Login</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}

              {debugInfo && (
                <Alert variant="info" className="mt-2" style={{ fontSize: '12px' }}>
                  <strong>Debug Info:</strong>
                  <pre className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username or Email</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="Enter username or email"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter password"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Form>

              {/* ✅ REMOVED Register link */}

            
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login