import { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, X } from 'lucide-react';
import { useAuth } from '@/features/auth';

interface ProfileData {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber?: string | null;
    designation?: string;     // Custom field
    department?: string;      // Custom field
    joinDate?: string;        // Custom field
}

interface SharedProfileProps {
    userData?: ProfileData;
    isEditable?: boolean;
    onSave?: (data: Partial<ProfileData>) => Promise<void>;
}

export default function SharedProfile({ userData, isEditable = false, onSave }: SharedProfileProps) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: userData?.displayName || user?.displayName || '',
        phoneNumber: userData?.phoneNumber || '',
        designation: userData?.designation || 'N/A',
        department: userData?.department || 'N/A'
    });
    const [loading, setLoading] = useState(false);

    // Merge passed userData with auth user if missing
    const displayUser = {
        title: formData.displayName || 'User',
        email: userData?.email || user?.email,
        photo: userData?.photoURL || user?.photoURL,
        role: userData?.designation || 'Employee'
    };

    const handleSave = async () => {
        if (!onSave) return;
        setLoading(true);
        try {
            await onSave(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Profile update failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10" />

                <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                            {displayUser.photo ? (
                                <img src={displayUser.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                        {isEditable && isEditing && (
                            <button className="absolute bottom-2 right-2 p-2 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-lg">
                                <Camera className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-2 pb-2">
                        {isEditing ? (
                            <input
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="text-3xl font-bold text-slate-900 bg-transparent border-b-2 border-indigo-200 focus:border-indigo-600 outline-none w-full md:w-auto text-center md:text-left"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-slate-900">{displayUser.title}</h1>
                        )}
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm font-medium text-slate-500">
                            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                                {displayUser.role}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                                <Mail className="w-3 h-3" /> {displayUser.email}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    {isEditable && (
                        <div className="pb-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                        aria-label="Cancel editing"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 min-h-[44px]"
                                    >
                                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 font-bold shadow-sm transition-all min-h-[44px]"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        Personal Details
                    </h3>

                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    {isEditing ? (
                        <input
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            // Law #7: text-base
                            className="w-full text-slate-700 font-medium bg-slate-50 px-3 py-3 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none border text-base sm:text-sm"
                            placeholder="+91..."
                        />
                    ) : (
                        <div className="text-slate-700 font-medium flex items-center gap-2 px-3 py-3">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {formData.phoneNumber || 'Not set'}
                        </div>
                    )}
                </div>

                <div className="group">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <div className="text-slate-700 font-medium flex items-center gap-2 opacity-75 px-3 py-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {displayUser.email}
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">Read-only</span>
                    </div>
                </div>
            </div>
            {/* Employment Info */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    Employment
                </h3>

                <div className="space-y-4">
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                        <div className="text-slate-700 font-medium flex items-center gap-2 px-3 py-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {formData.department}
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Designation</label>
                        <div className="text-slate-700 font-medium flex items-center gap-2 px-3 py-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {formData.designation}
                        </div>
                    </div>
                </div>
            </div>
        </div >
        </div >
    );
}
