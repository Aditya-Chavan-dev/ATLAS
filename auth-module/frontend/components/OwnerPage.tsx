import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function OwnerPage() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-between items-center mb-8">
                    <div><h1 className="text-3xl font-bold">OWNER PAGE</h1><p className="text-gray-600 mt-2">Welcome, {user?.email}</p></div>
                    <button onClick={async () => { await signOut(); navigate('/login'); }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Sign Out</button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-6 text-lg text-gray-700">Code yet to be written</div>
            </div>
        </div>
    );
}
