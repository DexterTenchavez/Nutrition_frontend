import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap'
import { useTheme, THEME_OPTIONS } from '../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../api/auth'
import './css/SettingsModal.css'

const SettingsModal = ({ show, onClose }) => {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)
    setPasswordLoading(true)

    try {
      const data = await authApi.changePassword(passwordForm)
      setPasswordMsg({ type: 'success', text: data.message || 'Password changed successfully.' })
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password. Please try again.'
      setPasswordMsg({ type: 'danger', text: message })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered className="settings-modal">
      <Modal.Header closeButton>
        <Modal.Title className="settings-title">
          <i className="bi bi-gear-fill me-2"></i>
          Settings
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="settings-section">
          <h6 className="settings-section-title">Appearance</h6>
          <div className="theme-toggle-row">
            <div className="theme-toggle-label">
              <strong>Theme mode</strong>
              <span className="theme-toggle-hint">Switch between light and dark appearance.</span>
            </div>
            <div className="theme-segmented">
              <button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}
              >
                <i className="bi bi-sun-fill"></i>
                Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                onClick={() => setTheme('dark')}
              >
                <i className="bi bi-moon-stars-fill"></i>
                Dark
              </button>
            </div>
          </div>

          <div className="accent-block">
            <div className="theme-toggle-label">
              <strong>Accent color</strong>
              <span className="theme-toggle-hint">Used for buttons, links, and highlights.</span>
            </div>
            <div className="accent-swatches">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`accent-swatch ${accent === opt.value ? 'active' : ''}`}
                  style={{ '--swatch': opt.color }}
                  onClick={() => setAccent(opt.value)}
                  title={opt.label}
                  aria-label={opt.label}
                >
                  {accent === opt.value && <i className="bi bi-check-lg"></i>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h6 className="settings-section-title">Account</h6>
          <div className="account-profile">
            <div className="account-avatar">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="account-meta">
              <strong className="account-name">{user?.username}</strong>
              <span className="account-email">{user?.email}</span>
              <span className={`badge account-role ${isAdmin ? 'role-admin' : 'role-staff'}`}>
                {user?.role}
              </span>
              {user?.barangay && (
                <span className="account-barangay">
                  <i className="bi bi-geo-alt-fill"></i> {user.barangay}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h6 className="settings-section-title">Security</h6>
          {passwordMsg && (
            <Alert variant={passwordMsg.type} dismissible onClose={() => setPasswordMsg(null)} className="mb-3">
              {passwordMsg.text}
            </Alert>
          )}
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label>Current password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                autoComplete="current-password"
                placeholder="Enter current password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
              />
            </Form.Group>
            <Button type="submit" variant="accent" className="btn-accent w-100" disabled={passwordLoading}>
              {passwordLoading ? (
                <><Spinner size="sm" as="span" animation="border" role="status" className="me-2" />Updating...</>
              ) : (
                <>Update password</>
              )}
            </Button>
          </Form>
        </div>

        <div className="settings-section">
          <h6 className="settings-section-title">Session</h6>
          <Button variant="outline-danger" className="w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SettingsModal