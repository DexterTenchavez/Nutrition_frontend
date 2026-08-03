import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import './css/Login.css'
import nutritionLogo from '../assets/nutritionlogo.jpg'


const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDebugInfo(null)
    setLoading(true)

    try {
      const result = await login(formData)


      if (result.success) {
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
    <div className="login-page">
      <div className="login-wrap">
        <Card className="login-card">
          <Card.Body>
            <div className="login-logo-wrap">
  {!logoFailed ? (
    <img
      src={nutritionLogo}
      alt="Municipal Nutrition Council logo"
      onError={() => setLogoFailed(true)}
    />
  ) : (
    <div className="login-logo-fallback">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 8.5 12 2 12 2Z" fill="#3F8F5D"/>
        <path d="M12 20C12 20 12 16 12 13" stroke="#F5F1E8" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </div>
  )}
</div>

            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">Nutrition Management Portal</p>

            {error && <Alert variant="danger">{error}</Alert>}

            {debugInfo && (
              <Alert variant="info" className="mt-2" style={{ fontSize: '12px' }}>
                <strong>Debug Info:</strong>
                <pre className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </Alert>
            )}

            <Form onSubmit={handleSubmit} className="login-form">
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

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <div className="password-input-wrapper">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter password"
                  />
                  <Button
                    variant="link"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </Button>
                </div>
              </Form.Group>

              <Button
                type="submit"
                className="w-100 login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default Login