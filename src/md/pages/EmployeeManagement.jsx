import React, { useState, useEffect } from 'react'
import { ref, onValue, set, remove, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
    Search, Plus, Trash2, Edit2,
    Mail, Calendar, Shield
} from 'lucide-react'
import { format } from 'date-fns'

// UI Components
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import MDToast from '../components/MDToast'

export default function MDEmployeeManagement() {
    const { currentUser } = useAuth()
    const [employees, setEmployees] = useState([])
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

    // Fetch Data
    useEffect(() => {
        const usersRef = ref(database, 'employees') // Updated to 'employees'
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const userList = Object.entries(data).map(([uid, val]) => ({
                    uid,
                    ...val
                }))
                setEmployees(userList)
            } else {
                setEmployees([])
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Handlers
    const handleAdd = async (e) => {
        e.preventDefault()
        setProcessing(true)
        try {
            const placeholderUid = `emp_${Date.now()}` // Changed prefix to emp_
            await set(ref(database, `employees/${placeholderUid}`), { // Updated to employees
                name: formData.name,
                email: formData.email,
                role: formData.role,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.email || 'MD',
                isPlaceholder: true
            })
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
            await update(ref(database, `employees/${selectedEmployee.uid}`), { // Updated to employees
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
            await remove(ref(database, `employees/${selectedEmployee.uid}`)) // Updated to employees
            setIsDeleteModalOpen(false)
            setSelectedEmployee(null)
            setToast({ type: 'success', message: "Member deleted successfully" })
        } catch (error) {
            console.error(error)
            setToast({ type: 'error', message: "Failed to delete member" })
        } finally {
            setProcessing(false)
        }
    }

    const openEdit = (emp) => {
        setSelectedEmployee(emp)
        setFormData({ name: emp.name, email: emp.email, role: emp.role })
        setIsEditModalOpen(true)
    }

    const openDelete = (emp) => {
        setSelectedEmployee(emp)
        setIsDeleteModalOpen(true)
    }

    const filteredEmployees = employees.filter(emp =>
        (emp.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (emp.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage access and roles for your organization</p>
                </div>
                <Button
                    icon={Plus}
                    onClick={() => setIsAddModalOpen(true)}
                    className="shrink-0"
                >
                    Add Member
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Input
                    placeholder="Search by name or email..."
                    icon={Search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-slate-900"
                />
            </div>

            {/* Content List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                    No members found matching "{searchQuery}"
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {/* Desktop Table Header */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-500 text-sm">
                        <div className="col-span-5">Member</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-3">Joined</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.uid} className="group lg:grid lg:grid-cols-12 lg:gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">

                                {/* Mobile-Optimized View: Flex Layout */}
                                {/* Desktop: Col Span 5 */}
                                <div className="col-span-5 flex items-center gap-3 mb-2 lg:mb-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                        {emp.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5">
                                            <Mail size={12} /> {emp.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="col-span-3 mb-2 lg:mb-0 pl-[52px] lg:pl-0">
                                    <div className="lg:hidden text-xs text-slate-400 mb-1">Role</div>
                                    <Badge variant={emp.role === 'admin' ? 'primary' : 'default'} className="uppercase text-[10px] tracking-wider">
                                        {emp.role}
                                    </Badge>
                                </div>

                                {/* Joined */}
                                <div className="col-span-3 mb-2 lg:mb-0 pl-[52px] lg:pl-0">
                                    <div className="lg:hidden text-xs text-slate-400 mb-1">Joined</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        <Calendar size={14} />
                                        {emp.createdAt ? format(new Date(emp.createdAt), 'MMM yyyy') : 'N/A'}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex lg:justify-end gap-2 pl-[52px] lg:pl-0 mt-2 lg:mt-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(emp)}
                                        className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => openDelete(emp)}
                                        className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Modals --- */}

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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Remove Member?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger-solid" onClick={handleDelete} loading={processing}>Delete Member</Button>
                    </>
                }
            >
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg flex gap-3 mb-4">
                    <Shield className="shrink-0 w-5 h-5" />
                    <p className="text-sm">This action operates on the database directly. If the user has already signed in, their authentication record might remain until manually cleared from Firebase Auth Console.</p>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to remove <b className="text-slate-900 dark:text-white">{selectedEmployee?.name}</b>? This action cannot be undone.
                </p>
            </Modal>

        </div>
    )
}
