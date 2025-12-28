import { useState, useMemo, useEffect } from 'react'
import { ref, update, query, orderByChild, limitToFirst, get } from 'firebase/database'
import { database, auth } from '../../firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Edit2, Trash2, CheckCircle, XCircle,
    Shield, Mail, User, Phone, Briefcase
} from 'lucide-react'
import RefinedModal from '../ui/RefinedModal'
import '../../pages/MetricsDashboard.css'

export default function AdminView({ currentUser }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all') // all, leadership, staff, suspended
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        primaryAction: null,
        secondaryAction: null
    })

    // Load employees with limit
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                // Fetch only first 200 users ordered by email to prevent crash
                const usersQuery = query(
                    ref(database, 'employees'),
                    orderByChild('profile/email'),
                    limitToFirst(200)
                )

                const snapshot = await get(usersQuery)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const empList = Object.entries(data).map(([uid, val]) => ({
                        uid,
                        ...val.profile,
                        status: val.profile?.status || 'active'
                    }))
                        .filter(emp => emp.email && emp.email.includes('@'))
                        .filter(emp => (emp.status || '').toLowerCase() !== 'deleted') // Soft Delete Filter

                    setEmployees(empList)
                }
                setLoading(false)
            } catch (error) {
                console.error('Error loading employees:', error)
                setLoading(false)
            }
        }
        loadEmployees()
    }, [])

    // Filter and Pagination
    const filteredEmployees = useMemo(() => {
        let data = employees

        // 1. Tab Filter
        if (activeTab === 'leadership') {
            data = data.filter(e => ['owner', 'md', 'hr'].includes(e.role))
        } else if (activeTab === 'staff') {
            data = data.filter(e => ['manager', 'employee'].includes(e.role) || !e.role)
        } else if (activeTab === 'suspended') {
            data = data.filter(e => (e.status || 'active').toLowerCase() !== 'active')
        }

        // 2. Search Filter
        const term = searchTerm.toLowerCase()
        return data.filter(emp => {
            const name = emp.name || emp.fullName || ''
            return (
                emp.email?.toLowerCase().includes(term) ||
                name.toLowerCase().includes(term) ||
                emp.role?.toLowerCase().includes(term)
            )
        })
    }, [employees, searchTerm, activeTab])

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
    const currentData = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Modal Helpers
    const showModal = (config) => setModalConfig({ ...config, isOpen: true })
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }))

    // Actions
    const handleUpdateRole = (uid, newRole) => {
        showModal({
            type: 'warning',
            title: 'Change User Role?',
            message: `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
            primaryAction: {
                label: 'Confirm Change',
                onClick: async () => {
                    try {
                        await update(ref(database, `employees/${uid}/profile`), { role: newRole })
                        setEmployees(prev => prev.map(e => e.uid === uid ? { ...e, role: newRole } : e))
                        closeModal()
                        showModal({ type: 'success', title: 'Role Updated', message: 'User role updated successfully.', onClose: closeModal })
                    } catch (error) {
                        showModal({ type: 'error', title: 'Update Failed', message: error.message, onClose: closeModal })
                    }
                }
            },
            secondaryAction: { label: 'Cancel', onClick: closeModal }
        })
    }

    const handleToggleStatus = (uid, currentStatus) => {
        // Normalizing status check (handle mixed case legacy data)
        const isCurrentlyActive = (currentStatus || 'active').toLowerCase() === 'active'
        const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE' // Send UPPERCASE
        const action = isCurrentlyActive ? 'Suspend' : 'Activate'

        showModal({
            type: isCurrentlyActive ? 'error' : 'success', // Red for suspend, Green for activate
            title: `${action} User?`,
            message: `Are you sure you want to ${action.toLowerCase()} this user?`,
            primaryAction: {
                label: `Yes, ${action}`,
                onClick: async () => {
                    try {
                        await update(ref(database, `employees/${uid}/profile`), { status: newStatus })
                        setEmployees(prev => prev.map(e => e.uid === uid ? { ...e, status: newStatus } : e))
                        closeModal()
                    } catch (error) {
                        const debugInfo = `User: ${auth.currentUser?.email || 'Unknown'} (${auth.currentUser?.uid ? auth.currentUser.uid.slice(0, 5) + '...' : 'No UID'})`
                        showModal({ type: 'error', title: 'Update Failed', message: `${error.message}\n\n[Debug: ${debugInfo}]`, onClose: closeModal })
                    }
                }
            },
            secondaryAction: { label: 'Cancel', onClick: closeModal }
        })
    }

    const handleDeleteUser = (uid) => {
        showModal({
            type: 'error',
            title: 'Delete User?',
            message: 'This will mark the user as deleted. They will lose access immediately.',
            primaryAction: {
                label: 'Delete User',
                onClick: async () => {
                    try {
                        // Soft Delete
                        await update(ref(database, `employees/${uid}/profile`), { status: 'DELETED' })
                        setEmployees(prev => prev.filter(e => e.uid !== uid))
                        closeModal()
                        showModal({ type: 'success', title: 'User Deleted', message: 'User has been removed from the list.', onClose: closeModal })
                    } catch (error) {
                        showModal({ type: 'error', title: 'Delete Failed', message: error.message, onClose: closeModal })
                    }
                }
            },
            secondaryAction: { label: 'Cancel', onClick: closeModal }
        })
    }

    return (
        <div className="admin-view space-y-6">
            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                {...modalConfig}
            />

            {/* Top Bar: Search & Tabs */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-24 z-30">
                {/* Search */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full md:w-auto flex-1 max-w-md relative"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center shadow-xl">
                            <Search className="ml-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-3 pr-4 py-3 bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 outline-none"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Categories */}
                <div className="bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-white/5 flex gap-1 overflow-x-auto max-w-full">
                    {[
                        { id: 'all', label: 'All Users' },
                        { id: 'leadership', label: 'Leadership' },
                        { id: 'staff', label: 'Staff' },
                        { id: 'suspended', label: 'Suspended' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading users...</div>
                ) : (<>
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-white/10">
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">User Identity</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role & Access</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode='popLayout'>
                                    {currentData.map((emp) => (
                                        <motion.tr
                                            key={emp.uid}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            layout
                                            className="group hover:bg-white/5 transition-colors"
                                        >
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold overflow-hidden border-2 border-slate-600 shadow-sm relative">
                                                        {emp.photoURL ? (
                                                            <img src={emp.photoURL} alt={emp.name || emp.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            (emp.name || emp.fullName)?.[0] || 'U'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-200">{emp.name || emp.fullName || 'Unknown User'}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Mail size={10} /> {emp.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={14} className="text-slate-500" />
                                                    <select
                                                        value={emp.role || 'employee'}
                                                        onChange={(e) => handleUpdateRole(emp.uid, e.target.value)}
                                                        className="bg-transparent text-sm text-slate-300 border-none focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors py-0 pl-0 pr-6"
                                                    >
                                                        <option className="bg-slate-800" value="employee">Employee</option>
                                                        <option className="bg-slate-800" value="manager">Manager</option>
                                                        <option className="bg-slate-800" value="hr">HR</option>
                                                        <option className="bg-slate-800" value="md">MD (Admin)</option>
                                                        <option className="bg-slate-800" value="owner">Owner</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleStatus(emp.uid, emp.status)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${(emp.status || 'active').toLowerCase() === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                        }`}
                                                >
                                                    {(emp.status || 'active').toLowerCase() === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                    {(emp.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Suspended'}
                                                </button>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleDeleteUser(emp.uid)}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-white/5">
                        {currentData.map(emp => (
                            <div key={emp.uid} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 overflow-hidden">
                                            {emp.photoURL ? <img src={emp.photoURL} className="w-full h-full object-cover" /> : (emp.name?.[0] || 'U')}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-200">{emp.name || emp.fullName}</div>
                                            <div className="text-xs text-slate-500">{emp.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus(emp.uid, emp.status)}
                                        className={`p-2 rounded-full border ${(emp.status || 'active').toLowerCase() === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}
                                    >
                                        {(emp.status || 'active').toLowerCase() === 'active' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={emp.role || 'employee'}
                                        onChange={(e) => handleUpdateRole(emp.uid, e.target.value)}
                                        className="flex-1 bg-slate-900/50 text-sm text-slate-300 border border-white/10 rounded-lg py-2 px-3 focus:ring-0"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="hr">HR</option>
                                        <option value="md">MD (Admin)</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                    <button
                                        onClick={() => handleDeleteUser(emp.uid)}
                                        className="p-2 text-slate-400 hover:text-red-400 bg-white/5 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {currentData.length === 0 && <div className="p-8 text-center text-slate-500">No users found.</div>}
                    </div>
                </>)}

                {/* Pagination */}
                <div className="bg-slate-900/30 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-500">
                        Page <span className="font-medium text-slate-300">{currentPage}</span> of {Math.max(1, totalPages)}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
