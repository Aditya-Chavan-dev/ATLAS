import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid'

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
    // Determine styles based on type
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-10 h-10 text-success" />
            case 'error': return <XCircleIcon className="w-10 h-10 text-danger" />
            default: return <InformationCircleIcon className="w-10 h-10 text-brand-primary" />
        }
    }

    const getButtonColor = () => {
        switch (type) {
            case 'success': return 'bg-success hover:bg-green-700'
            case 'error': return 'bg-danger hover:bg-red-700'
            default: return 'bg-brand-primary hover:bg-brand-dark'
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            transition
            className="relative z-50 transition duration-300 ease-out data-[closed]:opacity-0"
        >
            <div className="fixed inset-0 bg-neutral-dark/40 backdrop-blur-[2px] transition duration-200 ease-out data-[closed]:opacity-0" />

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <DialogPanel
                        className="w-full max-w-sm transform overflow-hidden rounded bg-white p-6 text-left align-middle shadow-float border-t-4 border-brand-primary transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 pt-0.5">
                                {getIcon()}
                            </div>
                            <div className="flex-1">
                                <DialogTitle
                                    as="h3"
                                    className="text-lg font-semibold leading-6 text-neutral-dark"
                                >
                                    {title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice')}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className="text-sm text-neutral-gray leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="button"
                                        className={`inline-flex justify-center rounded px-5 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${getButtonColor()}`}
                                        onClick={onClose}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
