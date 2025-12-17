// Enterprise Attendance Modal
import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import {
    XMarkIcon,
    BuildingOfficeIcon,
    MapPinIcon
} from '@heroicons/react/24/outline'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import ApiService from '../../services/api'

export default function AttendanceModal({ isOpen, onClose, onSuccess }) {
    const { currentUser } = useAuth()
    const [selectedLocation, setSelectedLocation] = useState(null) // 'Office' | 'Site'
    const [siteName, setSiteName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        setError('')
        if (!selectedLocation) {
            setError('Please select where you are working today.')
            return
        }
        if (selectedLocation === 'Site' && siteName.length < 3) {
            setError('Please enter a valid site name (min 3 chars).')
            return
        }

        setLoading(true)

        try {
            // Save to Firebase
            const dateStr = new Date().toISOString().split('T')[0]
            const timestamp = new Date().toISOString()
            // Use backend API ensuring notification trigger
            await ApiService.post('/api/attendance/mark', {
                uid: currentUser.uid,
                locationType: selectedLocation,
                siteName: selectedLocation === 'Site' ? siteName : null,
                timestamp,
                dateStr
            })

            onSuccess()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to mark attendance.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            transition
            className="relative z-50 transition duration-300 ease-out data-[closed]:opacity-0"
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition duration-300 ease-out data-[closed]:opacity-0" />

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
                    <DialogPanel
                        className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white text-left align-middle shadow-xl transition-all duration-300 ease-out data-[closed]:translate-y-full data-[closed]:opacity-0 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <DialogTitle as="h3" className="text-lg font-bold text-slate-900">
                                    Mark Attendance
                                </DialogTitle>
                                <p className="text-sm text-slate-500 mt-1">Where are you working today?</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Location Cards */}
                            <div className="grid gap-4">
                                {/* Office Option */}
                                <button
                                    onClick={() => setSelectedLocation('Office')}
                                    className={`relative flex items-center p-4 border-2 rounded-xl transition-all text-left group ${selectedLocation === 'Office'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full mr-4 ${selectedLocation === 'Office' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <BuildingOfficeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${selectedLocation === 'Office' ? 'text-blue-900' : 'text-slate-900'
                                            }`}>Office</h4>
                                        <p className="text-xs text-slate-500">Working from main office location</p>
                                    </div>
                                </button>

                                {/* Site Option */}
                                <button
                                    onClick={() => setSelectedLocation('Site')}
                                    className={`relative flex items-center p-4 border-2 rounded-xl transition-all text-left group ${selectedLocation === 'Site'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full mr-4 ${selectedLocation === 'Site' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <MapPinIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${selectedLocation === 'Site' ? 'text-blue-900' : 'text-slate-900'
                                            }`}>Site</h4>
                                        <p className="text-xs text-slate-500">Working from client/project site</p>
                                    </div>
                                </button>
                            </div>

                            {/* Site Name Input */}
                            <div className={`transition-all duration-300 overflow-hidden ${selectedLocation === 'Site' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="pt-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Site Location Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. Mumbai Construction Site"
                                        value={siteName}
                                        onChange={(e) => setSiteName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                                    <span className="mr-2">⚠️</span> {error}
                                </div>
                            )}

                            {/* Info Message */}
                            <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-start">
                                <span className="mr-2 text-lg">ℹ️</span>
                                <span className="mt-0.5">Your attendance will be sent to the MD for approval immediately. You will be notified once approved.</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 disabled:opacity-70 disabled:scale-100 transition-all flex-1 shadow-md"
                            >
                                {loading ? 'Sending Request...' : 'Send for Approval'}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
