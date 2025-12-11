import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon
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
                return <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            case 'error':
                return <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            case 'warning':
                return <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
            default:
                return <InformationCircleIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100'
            case 'error':
                return 'bg-red-100'
            case 'warning':
                return 'bg-amber-100'
            default:
                return 'bg-indigo-100'
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getColors()} sm:mx-0 sm:h-10 sm:w-10`}>
                                            {getIcon()}
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-900">
                                                {title}
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                {children ? (
                                                    <div className="text-sm text-slate-500">
                                                        {children}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500">
                                                        {message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                                    {primaryAction && (
                                        <button
                                            type="button"
                                            className={`inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto transition-transform active:scale-95
                                                ${type === 'error' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}
                                            `}
                                            onClick={primaryAction.onClick}
                                        >
                                            {primaryAction.label}
                                        </button>
                                    )}
                                    {secondaryAction && (
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-transform active:scale-95"
                                            onClick={secondaryAction.onClick}
                                        >
                                            {secondaryAction.label}
                                        </button>
                                    )}
                                    {!primaryAction && !secondaryAction && (
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
                                            onClick={onClose}
                                        >
                                            Close
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
