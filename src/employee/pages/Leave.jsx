// Enterprise Leave Page
import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import Toast from '../components/Toast'
import ApiService from '../../services/api'

// Sync with backend config manually for frontend preview
const HOLIDAYS = ['2025-01-26', '2025-08-15', '2025-10-02', '2025-12-25'];

export default function Leave() {
    const { currentUser } = useAuth()
    const [balance, setBalance] = useState({ pl: 17, co: 0 })
    const [formData, setFormData] = useState({
        type: 'PL', // PL | CO
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const [previewDays, setPreviewDays] = useState(0)

    // Fetch Balance
    useEffect(() => {
        if (!currentUser) return
        const balRef = ref(database, `users/${currentUser.uid}/leaveBalance`)
        const unsub = onValue(balRef, (snap) => {
            const val = snap.val()
            if (val) setBalance(val)
            else setBalance({ pl: 17, co: 0 })
        })
        return () => unsub()
    }, [currentUser])

    // Calculate Days Logic (Strict)
    const calculateDays = (start, end) => {
        if (!start || !end) return 0
        const s = new Date(start)
        const e = new Date(end)
        if (s > e) return 0

        let count = 0
        let current = new Date(s)
        while (current <= e) {
            const dateStr = current.toISOString().split('T')[0]
            const isSunday = current.getDay() === 0
            const isHoliday = HOLIDAYS.includes(dateStr)

            // Allow Sundays/Holidays if it's NOT PL (e.g. basic tracking), but rules say:
            // "Exclude Sundays... National Holidays" for PL.
            // "Count valid leave days precisely".
            // We assume CO also excludes them or maybe allows? "Can be used only when explicitly selected".
            // Generally CO is taken on working days. So same exclusion applies.

            if (!isSunday && !isHoliday) {
                count++
            }
            current.setDate(current.getDate() + 1)
        }
        return count
    }

    // Update preview when dates change
    useEffect(() => {
        const days = calculateDays(formData.startDate, formData.endDate)
        setPreviewDays(days)
    }, [formData.startDate, formData.endDate])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            setToast({ message: 'Please fill all required fields.', type: 'warning' })
            return
        }

        if (previewDays <= 0) {
            setToast({ message: 'Invalid date range selected (0 working days).', type: 'error' })
            return
        }

        // Client-side Balance Check
        if (formData.type === 'PL' && balance.pl < previewDays) {
            setToast({ message: `Insufficient PL Balance. Required: ${previewDays}, Available: ${balance.pl}`, type: 'error' })
            return
        }
        if (formData.type === 'CO' && balance.co < previewDays) {
            setToast({ message: `Insufficient Comp Off Balance. Required: ${previewDays}, Available: ${balance.co}`, type: 'error' })
            return
        }

        // Optimistic UI Update
        const originalForm = { ...formData };
        setFormData({ type: 'PL', startDate: '', endDate: '', reason: '' })
        setToast({ message: 'Leave request submitted successfully.', type: 'success' })

        // Optimistic Balance Update (Visual Only - real one comes from subscription)
        // We won't mutate `balance` state because onValue listener handles it, but for 
        // extremely fast feedback we could temp-decrement. 
        // Given onValue is fast, we'll rely on subscription for balance, but form reset is crucial.

        // Trigger Backend (Fire & Forget for UI)
        ApiService.post('/api/leave/apply', {
            employeeId: currentUser.uid,
            employeeName: currentUser.displayName || 'Employee',
            type: originalForm.type,
            from: originalForm.startDate,
            to: originalForm.endDate,
            reason: originalForm.reason,
        }).catch((error) => {
            console.error("Submission failed:", error)
            // Revert/Notify user
            setFormData(originalForm) // restore form
            setToast({ message: 'Sync failed: ' + (error.message || 'Server error'), type: 'error' })
        })
    }

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans p-6 pb-24 space-y-6 transition-colors duration-300">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Balance Card - Combined */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <p className="text-violet-100 text-sm font-medium mb-4 uppercase tracking-wide">My Balances</p>
                    <div className="flex justify-center gap-8 border-t border-white/10 pt-4">
                        <div className="text-center">
                            <span className="block font-black text-4xl mb-1">{balance.pl}</span>
                            <span className="text-violet-200 text-xs font-medium uppercase">Provisional (PL)</span>
                        </div>
                        <div className="w-[1px] bg-white/20"></div>
                        <div className="text-center">
                            <span className="block font-black text-4xl mb-1">{balance.co}</span>
                            <span className="text-violet-200 text-xs font-medium uppercase">Comp Off (CO)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 relative z-10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">New Leave Request</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Leave Type</label>
                        <select
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 py-2.5"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="PL">Provisional Leave (PL)</option>
                            <option value="CO">Compensatory Off (CO)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                            <input
                                type="date"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 py-2.5"
                                value={formData.startDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                            <input
                                type="date"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 py-2.5"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Preview Box */}
                    {(formData.startDate && formData.endDate) && (
                        <div className={`p-4 rounded-xl border ${(formData.type === 'PL' && balance.pl < previewDays) || (formData.type === 'CO' && balance.co < previewDays)
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold">Duration:</span>
                                <span className="font-bold">{previewDays} Days</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span>Remaining Balance:</span>
                                <span>
                                    {formData.type === 'PL' ? balance.pl : balance.co} - {previewDays} = <strong>{(formData.type === 'PL' ? balance.pl : balance.co) - previewDays}</strong>
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
                        <textarea
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 min-h-[100px] py-3"
                            placeholder="Reason for leave request..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-200 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-70"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    )
}

