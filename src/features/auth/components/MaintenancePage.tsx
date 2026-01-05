// Maintenance page component
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function MaintenancePage() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleOk = async () => {
        await signOut();  // Sign out user first
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                <div className="mb-6">
                    <svg
                        className="w-20 h-20 mx-auto text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Under Maintenance
                </h1>

                <p className="text-gray-600 mb-6">
                    We're currently working on something awesome. Please check back later.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500">
                        If you believe this is an error, please contact the administrator.
                    </p>
                </div>

                <button
                    onClick={handleOk}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    OK
                </button>
            </div>
        </div>
    );
}
