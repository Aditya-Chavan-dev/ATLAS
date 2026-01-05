import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function MaintenancePage() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                <div className="mb-6"><span className="text-6xl">🚧</span></div>
                <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
                <p className="text-gray-600 mb-6">We're working on something awesome. Check back later.</p>
                <button onClick={async () => { await signOut(); navigate('/login'); }} className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">OK</button>
            </div>
        </div>
    );
}
