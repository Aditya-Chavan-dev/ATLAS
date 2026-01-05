import { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase/config';
import { ref, update, query, orderByChild, limitToFirst, get } from 'firebase/database';
import { Search, Shield, AlertCircle, CheckCircle, Mail } from 'lucide-react';

interface Employee {
    uid: string;
    name?: string;
    fullName?: string; // Legacy support
    email: string;
    role?: string;
    status?: string;
    photoURL?: string;
}

export default function OwnerDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Load Employees (Similar to Legacy AdminView)
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const usersRef = ref(database, 'employees');
                // Fetch users (Optimized: legacy fetched all, we verify limit)
                const q = query(usersRef, orderByChild('profile/email'), limitToFirst(500));

                const snapshot = await get(q);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const empList = Object.entries(data).map(([uid, val]: [string, any]) => ({
                        uid,
                        ...val.profile, // Flatten profile
                        status: val.profile?.status || 'active'
                    })).filter(e => e.email); // Must have email

                    setEmployees(empList);
                }
            } catch (err) {
                console.error("Failed to load users", err);
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, []);

    // Filtering
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = (emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (emp.name || emp.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesRole = roleFilter === 'all' || (emp.role || 'employee') === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [employees, searchTerm, roleFilter]);

    // Bulk Selection Logic
    const toggleSelection = (uid: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(uid)) newSet.delete(uid);
        else newSet.add(uid);
        setSelectedUsers(newSet);
    };

    const toggleAll = () => {
        if (selectedUsers.size === filteredEmployees.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredEmployees.map(e => e.uid)));
        }
    };

    // Role Updates
    const updateRole = async (uid: string, newRole: string) => {
        // Only implemented for single updates for safety, or bulk 'employee'
        try {
            await update(ref(database, `employees/${uid}/profile`), { role: newRole });
            // Optimistic Update
            setEmployees(prev => prev.map(e => e.uid === uid ? { ...e, role: newRole } : e));
        } catch (e) {
            alert("Failed to update role");
        }
    };

    const handleBulkRoleUpdate = async (newRole: string) => {
        if (newRole !== 'employee') {
            alert("For safety, you can only bulk assign 'Employee' role. MD/HR/Owner must be assigned individually.");
            return;
        }
        if (!confirm(`Are you sure you want to set ${selectedUsers.size} users to 'Employee'?`)) return;

        const updates: any = {};
        selectedUsers.forEach(uid => {
            updates[`employees/${uid}/profile/role`] = newRole;
        });

        try {
            await update(ref(database), updates);
            setEmployees(prev => prev.map(e => selectedUsers.has(e.uid) ? { ...e, role: newRole } : e));
            setSelectedUsers(new Set()); // Clear selection
            alert("Bulk update complete");
        } catch (err) {
            console.error(err);
            alert("Bulk update failed");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Access Control</h1>
                    <p className="text-slate-500">Manage roles and permissions for {employees.length} users</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {selectedUsers.size > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs font-semibold text-indigo-700">{selectedUsers.size} Selected</span>
                            <div className="h-4 w-px bg-indigo-200"></div>
                            <button
                                onClick={() => handleBulkRoleUpdate('employee')}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                                Make Employee
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'owner', 'md', 'hr', 'employee'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${roleFilter === role
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedUsers.size === filteredEmployees.length && filteredEmployees.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading directory...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td></tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.uid} className={`group transition-colors ${selectedUsers.has(emp.uid) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={selectedUsers.has(emp.uid)}
                                                onChange={() => toggleSelection(emp.uid)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm border-2 border-white">
                                                    {emp.photoURL ? (
                                                        <img src={emp.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (emp.name || emp.fullName)?.[0] || 'U'
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">{emp.name || emp.fullName || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className={`
                                            w-full max-w-[140px] px-3 py-1.5 rounded-lg text-sm font-medium border-0 ring-1 ring-inset focus:ring-2 transition-all cursor-pointer
                                            ${(emp.role || 'employee') === 'owner' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                        (emp.role || 'employee') === 'md' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                                            (emp.role || 'employee') === 'hr' ? 'bg-pink-50 text-pink-700 ring-pink-600/20' :
                                                                'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-white'}
                                        `}
                                                value={emp.role || 'employee'}
                                                onChange={(e) => updateRole(emp.uid, e.target.value)}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="hr">HR</option>
                                                <option value="md">MD (Admin)</option>
                                                <option value="owner">Owner</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${(emp.status || 'active').toLowerCase() === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {(emp.status || 'active').toLowerCase() === 'active' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {(emp.status || 'active').charAt(0).toUpperCase() + (emp.status || 'active').slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
