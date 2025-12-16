// Enterprise Leave Page
import { useState } from 'react'
import { ref, push, set } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import Toast from '../components/Toast'

export default function Leave() {
    const { currentUser } = useAuth()
    const [formData, setFormData] = useState({
        type: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            setToast({ message: 'Please fill all required fields.', type: 'warning' })
            return
        }

        setIsSubmitting(true)
        try {
            const leaveRef = ref(database, `leaves`)
            const newLeaveRef = push(leaveRef)

            const payload = {
                uid: currentUser.uid,
                status: 'Pending',
                ...formData,
                timestamp: new Date().toISOString()
            }

            await set(newLeaveRef, payload)

            // Also save to user specific path for easy history
            await set(ref(database, `users/${currentUser.uid}/leaves/${newLeaveRef.key}`), payload)

            setFormData({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' })
            setToast({ message: 'Leave request submitted successfully.', type: 'success' })
        } catch (error) {
            console.error(error)
            setToast({ message: 'Failed to submit request.', type: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-full bg-slate-50 font-sans p-6 pb-24 space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Balance Card - Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-6 text-white text-center">
                <p className="text-blue-100 text-sm font-medium mb-1">Available Leave Balance</p>
                <h2 className="text-4xl font-bold mb-4">12 <span className="text-lg font-normal">Days</span></h2>
                <div className="flex justify-center gap-6 text-sm border-t border-blue-500/30 pt-4">
                    <div>
                        <span className="block font-bold">6</span>
                        <span className="text-blue-200 text-xs">Casual</span>
                    </div>
                    <div>
                        <span className="block font-bold">6</span>
                        <span className="text-blue-200 text-xs">Sick</span>
                    </div>
                </div>
            </div>

            {/* Request Form */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 -mt-2 relative z-10">
                <h3 className="text-lg font-bold text-slate-900 mb-4">New Request</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                        <select
                            className="input-field"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Casual Leave</option>
                            <option>Sick Leave</option>
                            <option>Emergency Leave</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                        <textarea
                            className="input-field min-h-[100px]"
                            placeholder="Brief reason for leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary w-full py-3 text-base shadow-md"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    )
}
