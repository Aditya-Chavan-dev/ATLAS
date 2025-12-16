// Refined Modal - ATLAS Style
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
    CheckIcon
} from '@heroicons/react/24/outline'

export default function RefinedModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'success', 'error', 'warning', 'info'
    primaryAction, // { label: string, onClick: () => void }
    secondaryAction, // { label: string, onClick: () => void }
    children
}) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                // Design specifically asks for a checkmark in a colored standard
                return <CheckIcon className="h-8 w-8 text-white" aria-hidden="true" />
            case 'error':
                return <XCircleIcon className="h-8 w-8 text-white" aria-hidden="true" />
            case 'warning':
                return <ExclamationTriangleIcon className="h-8 w-8 text-white" aria-hidden="true" />
            default:
                return <InformationCircleIcon className="h-8 w-8 text-white" aria-hidden="true" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return 'bg-[#5B4CFF]' // Specific Purple/Blue from design
            case 'error':
                return 'bg-red-500'
            case 'warning':
                return 'bg-amber-500'
            default:
                return 'bg-blue-500'
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[24px] bg-white text-center shadow-xl transition-all w-full max-w-xs sm:max-w-sm p-6">

                                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${getColors()} shadow-lg shadow-indigo-200`}>
                                    {getIcon()}
                                </div>

                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-2">
                                    {title}
                                </Dialog.Title>

                                <div className="mt-2 mb-6">
                                    {children ? (
                                        <div className="text-sm text-gray-500">{children}</div>
                                    ) : (
                                        <p className="text-sm text-gray-500">{message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    {primaryAction ? (
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-xl bg-[#FF9800] px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                                            onClick={primaryAction.onClick}
                                        >
                                            {primaryAction.label}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-xl bg-[#FF9800] px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 outline-none"
                                            onClick={onClose}
                                        >
                                            OK
                                        </button>
                                    )}

                                    {secondaryAction && (
                                        <button
                                            type="button"
                                            className="mt-1 w-full inline-flex justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                            onClick={secondaryAction.onClick}
                                        >
                                            {secondaryAction.label}
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
