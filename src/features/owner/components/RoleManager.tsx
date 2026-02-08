// RoleManager - Exact Replica of Legacy Features with Mobile-First Responsive Card Layout
import { useState, useMemo } from 'react';
import { useOwnerUsers } from '../hooks/useOwnerUsers';
import { Search, CheckCircle, Mail, Briefcase, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';
import type { UserRole } from '../types/owner.types';

export function RoleManager() {
    const { users, loading, updateRole, toggleStatus, deleteUser } = useOwnerUsers();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        onConfirm: () => { }
    });

    // 1. Filtering Logic
    const filteredUsers = useMemo(() => {
        let data = users;

        // Soft Delete Filter
        data = data.filter(u => u.status !== 'deleted');

        // Text Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(user =>
                user.email.toLowerCase().includes(term) ||
                (user.displayName || user.name || '').toLowerCase().includes(term)
            );
        }

        // Role/Tab Filter
        if (roleFilter !== 'all') {
            if (roleFilter === 'suspended') {
                data = data.filter(u => u.status === 'suspended');
            } else {
                data = data.filter(u => u.role === roleFilter);
            }
        }

        return data;
    }, [users, searchTerm, roleFilter]);

    // 2. Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentData = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Actions
    const confirmAction = (title: string, message: string, type: any, action: () => void) => {
        setModal({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => {
                action();
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleRoleChange = (uid: string, newRole: string) => {
        confirmAction(
            'Change Role?',
            `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
            'warning',
            () => updateRole(uid, newRole as UserRole)
        );
    };

    const handleStatusToggle = (uid: string, status: string) => {
        const isActive = status !== 'suspended';
        confirmAction(
            isActive ? 'Suspend User?' : 'Activate User?',
            `Are you sure you want to ${isActive ? 'suspend' : 'activate'} this user?`,
            isActive ? 'error' : 'success',
            () => toggleStatus(uid, status)
        );
    };

    const handleDelete = (uid: string) => {
        confirmAction(
            'Delete User?',
            'This will permanently archive the user. Continue?',
            'error',
            () => deleteUser(uid)
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading directory...</div>;

    return (
        <div className="flex flex-col h-full gap-4 pb-safe-bottom">
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                primaryAction={{ label: 'Confirm', onClick: modal.onConfirm }}
                secondaryAction={{ label: 'Cancel', onClick: () => setModal(prev => ({ ...prev, isOpen: false })) }}
            />

            {/* Header & Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            // Law #7: text-base on mobile
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-base sm:text-sm"
                        />
                    </div>

                    {/* Role Tabs - Scrollable on mobile */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full w-full md:w-auto scrollbar-hide">
                        {['all', 'owner', 'md', 'hr', 'manager', 'employee', 'suspended'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => { setRoleFilter(filter); setCurrentPage(1); }}
                                // Law #9: Touch Target
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-[32px] ${roleFilter === filter
                                    ? 'bg-white text-brand-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="bg-transparent md:bg-white rounded-xl md:shadow-sm md:border border-gray-200 overflow-hidden flex-1 flex flex-col">

                {/* Law #5: Responsive Table/Card Hybrid */}

                {/* DESKTOP: TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User Identity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role & Access</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence mode='popLayout'>
                                {currentData.map((user) => (
                                    <motion.tr
                                        key={user.uid}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.displayName || user.name || 'Unknown User'}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-slate-400" />
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                    className={`
                                                        bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer transition-colors py-1 pr-8 pl-0
                                                        ${user.role === 'owner' ? 'text-purple-600' :
                                                            user.role === 'md' ? 'text-brand-600' : 'text-slate-600'}
                                                    `}
                                                >
                                                    <option value="employee">Employee</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="hr">HR</option>
                                                    <option value="md">MD (Admin)</option>
                                                    <option value="owner">Owner</option>
                                                </select>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleStatusToggle(user.uid, user.status)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${user.status === 'suspended'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                    }`}>
                                                {user.status === 'suspended' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Archive User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* MOBILE: CARD STACK VIEW (Law #5) */}
                <div className="md:hidden space-y-3 flex-1 overflow-y-auto px-1 pb-20">
                    <AnimatePresence mode='popLayout'>
                        {currentData.map((user) => (
                            <motion.div
                                key={user.uid}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate text-base">{user.displayName || user.name || 'Unknown User'}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete - Law #10: Always Visible on Mobile */}
                                    <button
                                        onClick={() => handleDelete(user.uid)}
                                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label="Archive User"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                    {/* Role Selector */}
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${user.role === 'owner' ? 'bg-purple-100 text-purple-600' : 'bg-brand-50 text-brand-600'}`}>
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                            className="bg-transparent text-sm font-bold text-slate-700 border-none focus:ring-0 p-0 pr-6"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="hr">HR</option>
                                            <option value="md">Admin</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                    </div>

                                    {/* Status Toggle */}
                                    <button
                                        onClick={() => handleStatusToggle(user.uid, user.status)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${user.status === 'suspended'
                                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                        {user.status === 'suspended' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                        {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-slate-400 bg-gray-50/50">
                        No users found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="px-4 md:px-6 py-4 border-t border-gray-100 bg-white md:bg-gray-50 flex items-center justify-between rounded-xl md:rounded-none shrink-0 shadow-sm md:shadow-none">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50 min-h-[44px] px-2"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" /> Previous
                    </button>
                    <span className="text-sm text-slate-500">
                        Page <span className="font-bold text-slate-900">{currentPage}</span> / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50 min-h-[44px] px-2"
                    >
                        Next <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
}
