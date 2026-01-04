import { useState, useEffect, useCallback } from 'react'
import ApiService from '@/services/api'
import { getEmployeeStats } from '../utils/employeeStats' // Optional: if we need shared math
import logger from '@/utils/logger'

/**
 * THE "SINGLE SPIGOT"
 * Standardized hook for accessing employee data.
 * 
 * Replaces: onValue(ref(database, 'employees'))
 * Solves: 
 * 1. Over-fetching (Iceberg) -> Fetches only what API gives
 * 2. Connection Cap -> Uses HTTP, not WebSocket
 * 3. Tangled Logic -> All fetching logic is here
 */
export const useEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchEmployees = useCallback(async () => {
        setLoading(true)
        try {
            // THE REMEDY: Call the API, not the Database
            const response = await ApiService.get('/api/employees/list')

            if (response.success) {
                setEmployees(response.data)
                logger.info(`[useEmployees] Fetched ${response.count} employees via API`)
            } else {
                throw new Error(response.error || 'Failed to fetch employees')
            }
        } catch (err) {
            console.error('Error in useEmployees:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial Fetch
    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    // Manual Refresh Function (exposed to UI)
    const refresh = () => {
        fetchEmployees()
    }

    return { employees, loading, error, refresh }
}
