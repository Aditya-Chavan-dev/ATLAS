import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { BuildingOfficeIcon, MapPinIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AttendanceModal({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
    isCorrection = false,
    currentAttendance = null
}) {
    const [selectedType, setSelectedType] = useState(null) // null, 'OFFICE', 'SITE'
    const [siteName, setSiteName] = useState('')

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedType(null)
            setSiteName('')
        }
    }, [isOpen])

    const handleClose = () => {
        setSelectedType(null)
        setSiteName('')
        onClose()
    }

    const handleConfirm = () => {
        if (selectedType === 'SITE') {
            onConfirm('SITE', siteName)
        } else {
            onConfirm('OFFICE')
        }
        setSelectedType(null)
        setSiteName('')
    }

    const handleBack = () => {
        setSelectedType(null)
        setSiteName('')
    }

    const title = isCorrection
        ? 'Correction Request'
        : 'Where are you working today?'

    const subtitle = isCorrection && currentAttendance
        ? `Current: ${currentAttendance.location}${currentAttendance.siteName ? ` - ${currentAttendance.siteName}` : ''}`
        : null

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    {selectedType === 'SITE' ? (
                                        <button
                                            onClick={handleBack}
                                            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                                        >
                                            <ArrowLeftIcon className="w-5 h-5" />
                                            <span className="text-sm">Back</span>
                                        </button>
                                    ) : (
                                        <div>
                                            <Dialog.Title
                                                as="h3"
                                                className="text-lg font-medium leading-6 text-slate-900"
                                            >
                                                {title}
                                            </Dialog.Title>
                                            {subtitle && (
                                                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="text-slate-400 hover:text-slate-500 transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {isCorrection && !selectedType && (
                                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                                        Select the correct location. This will be sent for MD approval.
                                    </p>
                                )}

                                {/* Site Name Input */}
                                {selectedType === 'SITE' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Enter Site Name
                                            </label>
                                            <input
                                                type="text"
                                                value={siteName}
                                                onChange={(e) => setSiteName(e.target.value)}
                                                placeholder="e.g., Construction Site A"
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white text-slate-900"
                                                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={!siteName.trim() || isSubmitting}
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Submitting...' : isCorrection ? 'Submit Correction' : 'Confirm Site Attendance'}
                                        </button>
                                    </div>
                                ) : (
                                    /* Type Selection */
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => onConfirm('OFFICE')}
                                            disabled={isSubmitting}
                                            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <BuildingOfficeIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Office</span>
                                        </button>

                                        <button
                                            onClick={() => setSelectedType('SITE')}
                                            disabled={isSubmitting}
                                            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-orange-600 hover:bg-orange-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <MapPinIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-semibold text-slate-700 group-hover:text-orange-700">Site</span>
                                        </button>
                                    </div>
                                )}

                                {isSubmitting && !selectedType && (
                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-slate-500 animate-pulse">
                                            {isCorrection ? 'Submitting correction...' : 'Marking your attendance...'}
                                        </p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
