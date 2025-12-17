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
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans p-6 pb-24 space-y-6 transition-colors duration-300">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Balance Card - Gradient */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none p-6 text-white text-center relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-[-50%] left-[-20%] w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-50%] right-[-20%] w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <p className="text-violet-100 text-sm font-medium mb-1 uppercase tracking-wide">Available Balance</p>
                    <h2 className="text-5xl font-black mb-5 tracking-tight">12 <span className="text-lg font-medium text-violet-200">Days</span></h2>
                    <div className="flex justify-center gap-8 text-sm border-t border-white/10 pt-4">
                        <div className="text-center">
                            <span className="block font-bold text-lg">6</span>
                            <span className="text-violet-200 text-xs font-medium uppercase">Casual</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10"></div>
                        <div className="text-center">
                            <span className="block font-bold text-lg">6</span>
                            <span className="text-violet-200 text-xs font-medium uppercase">Sick</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 relative z-10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 bg-violet-600 rounded-full"></span>
                    New Request
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Leave Type</label>
                        <select
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 transition-all py-2.5"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Casual Leave</option>
                            <option>Sick Leave</option>
                            <option>Emergency Leave</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                            <input
                                type="date"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 transition-all py-2.5"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                            <input
                                type="date"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 transition-all py-2.5"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
                        <textarea
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-violet-500 focus:border-violet-500 transition-all min-h-[100px] py-3"
                            placeholder="Brief reason for leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-200 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    )
}
