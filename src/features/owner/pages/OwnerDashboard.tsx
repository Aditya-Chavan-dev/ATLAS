import { RoleManager } from '../components/RoleManager';

export default function OwnerDashboard() {
    return (
        <div className="h-full max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Access Control</h1>
                <p className="text-slate-500">Manage user roles and permissions</p>
            </div>

            <div className="h-[calc(100vh-12rem)]">
                <RoleManager />
            </div>
        </div>
    );
}
