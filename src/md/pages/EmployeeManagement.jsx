import React, { useState, useEffect } from 'react'
import { ref, onValue, set, remove, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
    Plus, Trash2, Edit2, PauseCircle,
    Mail, Shield
} from 'lucide-react'
import { format } from 'date-fns'
import { ROLES } from '../../config/roleConfig'
import { getEmployeeStats } from '../../utils/employeeStats'

// UI Components
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import MDToast from '../components/MDToast'
import ApiService from '../../services/api'

export default function MDEmployeeManagement() {
    const { currentUser } = useAuth()
    const [employees, setEmployees] = useState([])
    // Keeping searchQuery state to preserve logic, but removing UI controls for it
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Form/Selection State
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [formData, setFormData] = useState({ name: '', email: '', role: 'employee' })
    const [processing, setProcessing] = useState(false)

    // Fetch Data (Canonical Source Only)
    useEffect(() => {
        setLoading(true)
        const employeesRef = ref(database, 'employees')

        const unsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val() || {}
            // Use Centralized Utility
            // Date is not needed for list listing, passing empty string
            const { validEmployees } = getEmployeeStats(data, '')

            console.log('[EmployeeManagement] Loaded employees:', validEmployees.length)
            setEmployees(validEmployees)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Handlers
    const handleAdd = async (e) => {
        e.preventDefault()
        setProcessing(true)
        try {
            // STEP 5: Use Backend to Create Auth + DB Record
            // "MD adds employee -> Firebase Auth user is created -> Application DB record is created"
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role
            }

            const response = await ApiService.post('/api/auth/create-employee', payload)

            if (response.success) {
                // Success
                console.log('User created:', response.user)
            } else {
                throw new Error(response.error || 'Creation failed')
            }
            setIsAddModalOpen(false)
            setIsAddModalOpen(false)
            setFormData({ name: '', email: '', role: 'employee' })
            setToast({ type: 'success', message: "Member added successfully" })
        } catch (error) {
            console.error(error)
            setToast({ type: 'error', message: "Failed to add member" })
        } finally {
            setProcessing(false)
        }
    }

    const handleEdit = async (e) => {
        e.preventDefault()
        if (!selectedEmployee) return
        setProcessing(true)
        try {
            // Update in the specific source collection
            const collection = selectedEmployee.source || 'employees'
            // Target: employees/{uid}/profile (if source is employees)
            const path = collection === 'employees' ? `employees/${selectedEmployee.uid}/profile` : `users/${selectedEmployee.uid}`

            await update(ref(database, path), {
                name: formData.name,
                role: formData.role
            })
            setIsEditModalOpen(false)
            setSelectedEmployee(null)
            setToast({ type: 'success', message: "Member updated successfully" })
        } catch (error) {
            console.error(error)
            setToast({ type: 'error', message: "Failed to update member" })
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedEmployee) return
        setProcessing(true)
        try {
            // Revoke Access via Backend (Soft Delete)
            await ApiService.post('/api/auth/archive-employee', { uid: selectedEmployee.uid })

            setIsDeleteModalOpen(false)
            setSelectedEmployee(null)
            setToast({ type: 'success', message: "Member access revoked (Data archived)" })
        } catch (error) {
            console.error(error)
            setToast({ type: 'error', message: "Failed to archive member" })
        } finally {
            setProcessing(false)
        }
    }

    const openEdit = (emp) => {
        setSelectedEmployee(emp)
        setFormData({ name: emp.name, email: emp.email, role: emp.role, phone: emp.phone || '' })
        setIsEditModalOpen(true)
    }

    const openDelete = (emp) => {
        setSelectedEmployee(emp)
        setIsDeleteModalOpen(true)
    }

    // Filter Logic Preserved
    const filteredEmployees = employees.filter(emp =>
        (emp.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (emp.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto p-4 md:p-6 pb-24 lg:pb-6">
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Simplified Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Team Management</h2>
                <Button
                    icon={Plus}
                    onClick={() => setIsAddModalOpen(true)}
                    className="shrink-0"
                >
                    Add Member
                </Button>
            </div>

            {/* Content List - Clean Grid of Cards */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                    No members found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredEmployees.map((emp) => (
                        <div
                            key={emp.uid}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-lg">
                                    {emp.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate" title={emp.name}>
                                        {emp.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 truncate flex items-center gap-1" title={emp.email}>
                                        {emp.email}
                                    </p>
                                    {emp.phone && (
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                                            {emp.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                                <button
                                    onClick={() => openEdit(emp)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Edit Details"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                                    title="Pause Access (Coming Soon)"
                                >
                                    <PauseCircle size={18} />
                                </button>
                                <button
                                    onClick={() => openDelete(emp)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Remove Access"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Modals (Preserved) --- */}

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Member"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} loading={processing}>Add Member</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Role</label>
                        <select
                            className="input-field w-full"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="employee">Employee</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Role & Details"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} loading={processing}>Save Changes</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div className="opacity-50 cursor-not-allowed">
                        <Input
                            label="Email Address"
                            value={formData.email}
                            disabled
                        />
                        <p className="text-xs text-slate-500 mt-1 ml-1">Email cannot be changed directly.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Role</label>
                        <select
                            className="input-field w-full"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="employee">Employee</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Revoke Access?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger-solid" onClick={handleDelete} loading={processing}>Revoke Access</Button>
                    </>
                }
            >
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg flex gap-3 mb-4">
                    <Shield className="shrink-0 w-5 h-5" />
                    <p className="text-sm">
                        <b>Access Revocation Policy:</b> The user's account will be disabled immediately, preventing any further login.
                        <br /><br />
                        Note: Historic attendance data will be <b>retained for 30 days</b> for audit purposes before permanent deletion.
                    </p>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to revoke access for <b className="text-slate-900 dark:text-white">{selectedEmployee?.name}</b>?
                </p>
            </Modal>

        </div>
    )
}
