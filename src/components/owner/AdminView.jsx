import { useState, useEffect, useRef, useCallback } from 'react'
import { ref, get, query, orderByChild, limitToFirst, startAfter, startAt, endAt, update, remove } from 'firebase/database'
import { database } from '../../firebase/config'
import { ROLES } from '../../config/roleConfig'
import { format } from 'date-fns'

const PAGE_SIZE = 20

export default function AdminView({ currentUser }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [lastKey, setLastKey] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [editingUser, setEditingUser] = useState(null)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)

    // Debounce Search
    const searchTimeout = useRef(null)

    // -----------------------------------------------------
    // 1. DATA FETCHING (PAGINATED)
    // -----------------------------------------------------
    const fetchUsers = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true)
        else setLoadingMore(true)
        setError(null)

        try {
            const usersRef = ref(database, 'employees')
            let q

            if (searchTerm.trim()) {
                // SEARCH MODE (Direct Query, No Pagination needed for now unless huge results)
                // Note: Firebase RTDB only supports searching by one field. We'll search by Name.
                // Improve: Create a specific 'searchIndex' path if needed, but 'profile/name' works reasonably well.
                // Actually, our structure is employees/{uid}/profile/name. 
                // We cannot index deeply nested fields easily without rules indexOn.
                // Fallback for Search: We might have to scan if we don't have an index.
                // BEST PRACTICE: For robust search, use Algolia/Elastic.
                // PRAGMATIC FIX: Search by exact email or prefix name if possible.
                // Let's rely on 'ordering by key' (default) and client-side filter IF the list is small enough? 
                // NO, that defeats the purpose.
                // New Strategy: Search is a "Special Mode". Ideally we use `orderByChild('profile/email')`.
                // For now, let's implement the PAGINATION for the Main List (Empty Search).

                // If search is active, we validly warn this is a "Heavy Operation" or we only search specific fields.
                // Let's implement Client-Side Search of "All Loaded Users" + "Load All Button"?
                // No, that's bad. 
                // Let's assume for this fix, we primarily solve the "Default View" Scalability.
                // Search will be: "Search by Email" (Server Query).
                q = query(
                    usersRef,
                    orderByChild('profile/email'),
                    startAt(searchTerm),
                    endAt(searchTerm + "\uf8ff"),
                    limitToFirst(50)
                )
            } else {
                // DEFAULT PAGINATED VIEW
                if (isLoadMore && lastKey) {
                    q = query(usersRef, limitToFirst(PAGE_SIZE), startAfter(lastKey)) // startAfter requires order, default is Key
                } else {
                    q = query(usersRef, limitToFirst(PAGE_SIZE))
                }
            }

            const snapshot = await get(q)

            if (snapshot.exists()) {
                const data = snapshot.val()
                const userList = Object.entries(data).map(([uid, userData]) => ({
                    uid,
                    ...userData.profile
                }))
                    // DEFENSIVE FILTER: Exclude any user without a valid email
                    // This guards against anonymous/demo users or corrupted data
                    .filter(user => user.email && user.email.includes('@'))

                // Update Key for next page
                if (userList.length > 0) {
                    // Since we default ordered by Key, the last key is the last UID
                    setLastKey(userList[userList.length - 1].uid)
                }

                if (userList.length < PAGE_SIZE) {
                    setHasMore(false)
                } else {
                    setHasMore(true)
                }

                if (isLoadMore) {
                    setUsers(prev => [...prev, ...userList])
                } else {
                    setUsers(userList)
                }
            } else {
                if (!isLoadMore) setUsers([])
                setHasMore(false)
            }

        } catch (err) {
            console.error(err)
            setError('Failed to fetch data: ' + err.message)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [lastKey, searchTerm])

    // Initial Load & Search Trigger
    useEffect(() => {
        // Debounce search to prevent flashing
        if (searchTimeout.current) clearTimeout(searchTimeout.current)

        searchTimeout.current = setTimeout(() => {
            // Reset for new search or initial load
            setLastKey(null)
            setHasMore(true) // reset
            fetchUsers(false)
        }, 500)

        return () => clearTimeout(searchTimeout.current)
    }, [searchTerm]) // Dependency on searchTerm only. fetchUsers is stable or excluded to avoid loop.

    // -----------------------------------------------------
    // ACTIONS
    // -----------------------------------------------------
    const handleRoleChange = async (uid, newRole) => {
        try {
            await update(ref(database, `employees/${uid}/profile`), { role: newRole })
            showSuccess(`Role updated to ${newRole}`)
            setEditingUser(null)
            // Optimistic Update
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
        } catch (err) {
            setError('Failed to update role: ' + err.message)
        }
    }

    const handleStatusChange = async (uid, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        if (!window.confirm(`Change status to ${newStatus}?`)) return

        try {
            await update(ref(database, `employees/${uid}/profile`), { status: newStatus })
            showSuccess(`User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`)
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u))
        } catch (err) {
            setError('Failed to update status: ' + err.message)
        }
    }

    const handleDelete = async (uid) => {
        if (!window.confirm('⚠️ PERMANENTLY DELETE USER?')) return

        try {
            await remove(ref(database, `employees/${uid}`))
            showSuccess('User deleted')
            setUsers(prev => prev.filter(u => u.uid !== uid))
        } catch (err) {
            setError('Failed to delete: ' + err.message)
        }
    }

    const showSuccess = (msg) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    return (
        <div className="admin-view p-6 bg-slate-50 min-h-screen">
            {/* Header / Stats */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    User Management
                    <span className="text-sm font-normal text-slate-500 ml-2">(Paginated View)</span>
                </h2>
                {/* Stats removed because we don't download all users anymore! Scalability trade-off. */}
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                    <button className="absolute top-0 right-0 px-4 py-3" onClick={() => setError(null)}>×</button>
                </div>
            )}
            {successMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMsg}</div>
            )}

            {/* Controls */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by Email..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && !users.length ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUser === user.uid ? (
                                                <select
                                                    className="text-sm border rounded p-1"
                                                    defaultValue={user.role}
                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                    onBlur={() => setEditingUser(null)}
                                                    autoFocus
                                                >
                                                    {Object.values(ROLES).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                                </select>
                                            ) : (
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 cursor-pointer`}
                                                    onClick={() => setEditingUser(user.uid)}
                                                >
                                                    {user.role ? user.role.toUpperCase() : 'NO ROLE'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 mr-3" onClick={() => setEditingUser(user.uid)}>Edit</button>
                                            <button className="text-yellow-600 hover:text-yellow-900 mr-3" onClick={() => handleStatusChange(user.uid, user.status)}>
                                                {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                            </button>
                                            <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(user.uid)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {hasMore && !searchTerm && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center">
                        <button
                            onClick={() => fetchUsers(true)}
                            disabled={loadingMore}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            {loadingMore ? 'Loading more...' : 'Load More Users'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

