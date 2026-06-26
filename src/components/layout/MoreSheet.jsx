import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './MoreSheet.css'

export default function MoreSheet({ isOpen, onClose }) {
  const { role, logout } = useAuth()
  const navigate = useNavigate()

  function go(path) {
    navigate(path)
    onClose()
  }

  async function handleSignOut() {
    onClose()
    await logout()
  }

  return (
    <>
      <div
        className={'more-sheet-overlay' + (isOpen ? ' more-sheet-overlay--open' : '')}
        onClick={onClose}
      />
      <div className={'more-sheet' + (isOpen ? ' more-sheet--open' : '')}>
        {role === 'president' && (
          <button className="more-sheet-item" onClick={() => go('/president')}>President</button>
        )}
        <button className="more-sheet-item" onClick={() => go('/admin/coaches')}>Coaches</button>
        <button className="more-sheet-item" onClick={() => go('/admin/canteen')}>Canteen</button>
        <button className="more-sheet-item" onClick={() => go('/account')}>Account</button>
        <button className="more-sheet-item more-sheet-item--signout" onClick={handleSignOut}>Sign out</button>
      </div>
    </>
  )
}
