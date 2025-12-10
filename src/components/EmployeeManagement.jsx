import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import DataTable from './DataTable'
import './EmployeeManagement.css'

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const usersRef = ref(database, 'users')
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const list = Object.entries(data).map(([id, item]) => ({
                    id,
                    ...item
                }))
                setEmployees(list)
            } else {
                setEmployees([])
            }
            setLoading(false)
        })

        return unsubscribe
    }, [])

    const columns = [
        {
            key: 'displayName',
            label: 'Name',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {value?.[0]?.toUpperCase() || row.email?.[0]?.toUpperCase()}
                    </div>
                    <span>{value || 'Unknown'}</span>
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true
        },
        {
            key: 'phoneNumber',
            label: 'Phone',
            render: (value) => value || '-'
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (value) => (
                <span className={`role-badge ${value || 'employee'}`}>
                    {value || 'employee'}
                </span>
            )
        },
        {
            key: 'updatedAt',
            label: 'Last Updated',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ]

    return (
        <div className="employee-management-container">
            <div className="employee-management-header">
                <h2 className="employee-management-title">Employee Management</h2>
                <p className="employee-management-subtitle">
                    View and manage all registered employees in the system
                </p>
            </div>

            {loading ? (
                <div className="p-8 text-center text-text-secondary">Loading employees...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={employees}
                    showActions={false}
                    emptyMessage="No employees found"
                />
            )}
        </div>
    )
}
