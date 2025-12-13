import { useState, useEffect } from 'react'
import { ref, onValue, remove, set, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { ROLES } from '../../config/roleConfig'
import { useAuth } from '../../context/AuthContext'
import './EmployeeManagement.css'

function MDEmployeeManagement() {
    const { currentUser } = useAuth();
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newEmployee, setNewEmployee] = useState({ name: '', email: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState(null) // { uid, email, name }
    const [editTarget, setEditTarget] = useState(null) // { uid, email, name }

    useEffect(() => {
        const usersRef = ref(database, 'users')
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const userList = Object.entries(data)
                    .map(([uid, userData]) => ({
                        uid,
                        ...userData
                    }))
                    .filter(u => u.role === ROLES.EMPLOYEE)
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                setEmployees(userList)
            } else {
                setEmployees([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleUpdateEmployee = async (uid, newName) => {
        if (!newName.trim()) return
        setIsSubmitting(true)
        try {
            await update(ref(database, `users/${uid}`), { name: newName })
            setEditTarget(null)
        } catch (error) {
            console.error('Error updating employee:', error)
            alert('Failed to update employee name')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddEmployee = async (e) => {
        e.preventDefault()
        console.log('🚀 Starting add employee process...')
        setError('')

        if (!currentUser) {
            console.error('❌ No current user logged in')
            setError('You must be logged in to add a team member.')
            return
        }

        const email = newEmployee.email.trim().toLowerCase()
        const name = newEmployee.name.trim()

        console.log('📝 Validating input:', { name, email })

        if (!email || !name) {
            setError('Both name and email are required')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        // Check if email already exists
        const existingEmployee = employees.find(emp => emp.email?.toLowerCase() === email)
        if (existingEmployee) {
            console.warn('⚠️ Employee already exists:', existingEmployee)
            setError('A team member with this email already exists')
            return
        }

        setIsSubmitting(true)

        try {
            // Create a placeholder UID using email (will be migrated when user logs in)
            const safeEmail = email.replace(/[.@]/g, '_')
            const placeholderUid = `placeholder_${safeEmail}`
            console.log('🔑 Generated placeholder UID:', placeholderUid)

            const userRef = ref(database, `users/${placeholderUid}`)

            const payload = {
                name,
                email,
                role: ROLES.EMPLOYEE,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.email || 'MD', // Use actual user
                isPlaceholder: true // Flag to indicate this is a pre-registered employee
            }

            console.log('💾 Saving to Firebase:', payload)
            await set(userRef, payload)
            console.log('✅ Save successful!')

            setNewEmployee({ name: '', email: '' })
            setShowAddForm(false)
            alert(`✅ Team member ${name} added successfully!`) // Success message
        } catch (error) {
            console.error('❌ Error adding team member:', error, error?.message, error?.code)
            setError(`Failed to add team member: ${error?.message || error}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveEmployee = (uid, email, name) => {
        setDeleteConfirm({ uid, email, name })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return

        try {
            const userRef = ref(database, `users/${deleteConfirm.uid}`)
            await remove(userRef)
            setDeleteConfirm(null)
        } catch (error) {
            console.error('Error removing team member:', error)
            alert('Failed to remove team member')
        }
    }

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="page-header">
                    <div>
                        <h1>Team Management</h1>
                        <p>Add and manage team member access</p>
                    </div>
                    <button
                        className="add-employee-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add Team Member
                    </button>
                </header>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                            <div className="delete-icon">⚠️</div>
                            <h2>Remove Team Member?</h2>
                            <p>Are you sure you want to remove <strong>{deleteConfirm.name || deleteConfirm.email}</strong>?</p>
                            <p className="delete-warning">This will revoke their access to the system.</p>
                            <div className="form-actions">
                                <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                </button>
                                <button className="delete-confirm-btn" onClick={confirmDelete}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Team Member Modal */}
                {editTarget && (
                    <div className="modal-overlay" onClick={() => setEditTarget(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Edit Team Member</h2>
                                <button className="close-btn" onClick={() => setEditTarget(null)}>×</button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                handleUpdateEmployee(editTarget.uid, editTarget.name)
                            }} className="add-form">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter team member name"
                                        value={editTarget.name}
                                        onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={editTarget.email}
                                        disabled
                                        className="bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setEditTarget(null)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Team Member Modal */}
                {showAddForm && (
                    <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add Employee Access</h2>
                                <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
                            </div>
                            <form onSubmit={handleAddEmployee} className="add-form">
                                <div className="form-group">
                                    <label>Employee Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter employee name"
                                        value={newEmployee.name}
                                        onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Employee Email (will get access to ATLAS)</label>
                                    <input
                                        type="email"
                                        placeholder="Enter employee email"
                                        value={newEmployee.email}
                                        onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    />
                                </div>
                                {error && <div className="form-error">{error}</div>}
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                        {isSubmitting ? 'Adding...' : 'Add Employee'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Team Member List */}
                {loading ? (
                    <div className="loading-state">Loading team members...</div>
                ) : employees.length === 0 ? (
                    <div className="empty-state">
                        <p>No team members added yet.</p>
                        <p>Click "Add Team Member" to register new team members.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="employees-table-container hidden md:block">
                            <table className="employees-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Added On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.uid}>
                                            <td>
                                                <div className="emp-cell">
                                                    <div className="emp-avatar-sm">
                                                        {(emp.name || emp.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{emp.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td>{emp.email}</td>
                                            <td>
                                                <span className={`status-badge ${emp.isPlaceholder ? 'pending' : 'active'}`}>
                                                    {emp.isPlaceholder ? 'Pending Login' : 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                {emp.createdAt
                                                    ? new Date(emp.createdAt).toLocaleDateString()
                                                    : '-'}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => setEditTarget({ uid: emp.uid, name: emp.name || '', email: emp.email })}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => handleRemoveEmployee(emp.uid, emp.email, emp.name)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="employees-card-list md:hidden">
                            {employees.map(emp => (
                                <div key={emp.uid} className="emp-card-mobile">
                                    <div className="emp-card-header-mobile">
                                        <div className="emp-avatar-sm">
                                            {(emp.name || emp.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4>{emp.name || 'Unknown'}</h4>
                                            <p className="emp-email-mobile">{emp.email}</p>
                                        </div>
                                    </div>
                                    <div className="emp-card-body-mobile">
                                        <div className="status-row">
                                            <span className={`status-badge ${emp.isPlaceholder ? 'pending' : 'active'}`}>
                                                {emp.isPlaceholder ? 'Pending Login' : 'Active'}
                                            </span>
                                            <span className="joined-date">
                                                Joined: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="emp-card-actions-mobile">
                                        <button
                                            className="edit-btn-mobile"
                                            onClick={() => setEditTarget({ uid: emp.uid, name: emp.name || '', email: emp.email })}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="remove-btn-mobile"
                                            onClick={() => handleRemoveEmployee(emp.uid, emp.email, emp.name)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default MDEmployeeManagement
