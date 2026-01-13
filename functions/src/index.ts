
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addDays, isSunday, format, differenceInDays, getDay } from 'date-fns';

admin.initializeApp();
const db = admin.database();

// --- HELPERS ---
const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
};

const getHolidays = async (year: string): Promise<string[]> => {
    const snap = await db.ref(`config/holidays/${year}`).once('value');
    if (snap.exists()) {
        const data = snap.val();
        return Array.isArray(data) ? data : Object.values(data);
    }

    // FALLBACK: Essential National Holidays (Prevent hard crash if DB empty)
    if (year === '2026') return ['2026-01-26', '2026-08-15', '2026-10-02', '2026-11-01', '2026-12-25'];
    return [];
};

const isHoliday = (date: Date, holidays: string[]) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.includes(dateStr);
};

// Pure logic: calculates days excluding Sundays and Holidays
const calculateSandwichDays = (from: string, to: string, holidays: string[]) => {
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;
    let current = start;

    while (current <= end) {
        if (!isSunday(current) && !isHoliday(current, holidays)) {
            count++;
        }
        current = addDays(current, 1);
    }
    return count;
};

// --- SECURITY: Helpers ---
const logSecurityAlert = async (context: functions.https.CallableContext, reason: string) => {
    const uid = context.auth?.uid || 'anonymous';
    const email = context.auth?.token.email || 'unknown';
    await db.ref(`system_alerts/${format(new Date(), 'yyyy-MM-dd')}`).push({
        type: 'SECURITY_ALERT',
        reason,
        uid,
        email,
        ip: (context as any).rawRequest?.ip || 'unknown',
        timestamp: admin.database.ServerValue.TIMESTAMP
    });
};

const logAudit = async (uid: string, action: string, details: any, actorUid?: string) => {
    await db.ref('audit_logs').push({
        action,
        actor: actorUid || uid,
        target: uid,
        details,
        timestamp: admin.database.ServerValue.TIMESTAMP
    });
};

const checkRateLimit = async (uid: string, action: string, windowSeconds: number = 5) => {
    const ref = db.ref(`rate_limits/${uid}/${action}`);
    const snap = await ref.once('value');
    const lastTime = snap.val();
    const now = Date.now();

    if (lastTime && (now - lastTime) < (windowSeconds * 1000)) {
        throw new functions.https.HttpsError('resource-exhausted', `Rate limit exceeded. Try again in ${windowSeconds}s.`);
    }

    await ref.set(now);
};

// --- SECURITY: Verify Custom Claims ---
const assertRole = async (context: functions.https.CallableContext, allowedRoles: string[]) => {
    if (!context.auth) {
        await logSecurityAlert(context, 'Unauthenticated Access Attempt');
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // STRICT: No default role. If you have no role, you are a GUEST/UNAUTHORIZED.
    // Cast to any to access custom claims not in default type definition
    const role = (context.auth.token as any).role;
    if (!role) {
        await logSecurityAlert(context, 'No Role Assigned');
        throw new functions.https.HttpsError('permission-denied', 'No role assigned. Contact Administrator.');
    }

    if (!allowedRoles.includes(role)) {
        await logSecurityAlert(context, `Insufficient Permissions: Has ${role}, Needed ${allowedRoles.join(',')}`);
        throw new functions.https.HttpsError('permission-denied', 'Insufficient Permissions');
    }
};

// --- GATEKEEPER: Whitelist & Role Assignment ---
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email } = user;
    if (!email) {
        await admin.auth().deleteUser(uid);
        return;
    }

    // Check Whitelist in Firestore
    const snapshot = await admin.firestore().collection('users')
        .where('email', '==', email)
        .where('status', '==', 'active')
        .get();

    if (snapshot.empty) {
        await admin.auth().deleteUser(uid);
        console.error(`Blocked unauthorized sign-in: ${email}`);
        return;
    }

    const userData = snapshot.docs[0].data();

    // Set Claims
    await admin.auth().setCustomUserClaims(uid, {
        role: userData.role || 'employee',
        token_version: userData.token_version || 1
    });

    // Update RTDB Profile with trusted data from Firestore
    await db.ref(`employees/${uid}/profile`).update({
        email: email,
        role: userData.role || 'employee',
        name: userData.name || userData.fullName || email.split('@')[0],
        status: 'active',
        joinedAt: admin.database.ServerValue.TIMESTAMP
    });

    // Update Firestore UID mapping
    await snapshot.docs[0].ref.update({ uid });
});

// --- FUNCTION: Apply For Leave (Secure Write) ---
export const applyForLeave = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    // ABUSE PREV: Rate Limit (1 request per 10s)
    await checkRateLimit(context.auth.uid, 'applyForLeave', 10);

    // Strict Zero Trust: Must have a role
    const role = (context.auth.token as any).role;
    if (!role) throw new functions.https.HttpsError('permission-denied', 'No role');

    const { from, to, type, reason } = data;
    const uid = context.auth.uid;

    if (!from || !to || !type) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

    // SECURITY: Prevent Infinite Loop / DoS
    const rangeDays = differenceInDays(new Date(to), new Date(from));
    if (rangeDays < 0) throw new functions.https.HttpsError('invalid-argument', 'End date before start date');
    if (rangeDays > 60) throw new functions.https.HttpsError('invalid-argument', 'Leave request exceeds 60 days limit');

    // Fetch holidays dynamically (support cross-year leaves)
    const startYear = format(new Date(from), 'yyyy');
    const endYear = format(new Date(to), 'yyyy');
    let holidays = await getHolidays(startYear);
    if (startYear !== endYear) {
        const nextHolidays = await getHolidays(endYear);
        holidays = [...holidays, ...nextHolidays];
    }

    const days = calculateSandwichDays(from, to, holidays);
    if (days <= 0) throw new functions.https.HttpsError('invalid-argument', 'Zero working days selected');

    const leavesRef = db.ref(`leaves/${uid}`);

    // Check Overlap (Simple Check)
    const snapshot = await leavesRef.orderByChild('status').equalTo('pending').once('value');
    if (snapshot.exists()) {
        const pending = snapshot.val();
        const rangeStart = new Date(from).getTime();
        const rangeEnd = new Date(to).getTime();

        const hasOverlap = Object.values(pending).some((l: any) => {
            const lStart = new Date(l.from).getTime();
            const lEnd = new Date(l.to).getTime();
            return (rangeStart <= lEnd && rangeEnd >= lStart);
        });

        if (hasOverlap) throw new functions.https.HttpsError('already-exists', 'Overlapping leave request');
    }

    const newRef = leavesRef.push();
    await newRef.set({
        uid,
        from,
        to,
        type,
        reason,
        days,
        status: 'pending',
        appliedAt: admin.database.ServerValue.TIMESTAMP
    });

    await newRef.set({
        uid,
        from,
        to,
        type,
        reason,
        days,
        status: 'pending',
        appliedAt: admin.database.ServerValue.TIMESTAMP
    });

    await logAudit(uid, 'APPLY_LEAVE', { leaveId: newRef.key, days, type });

    return { success: true, id: newRef.key, days };
});

// --- FUNCTION: Approve Leave (Atomic Balance Deduction) ---
export const approveLeave = functions.https.onCall(async (data, context) => {
    await assertRole(context, ['owner', 'md']);

    const { uid, leaveId } = data;

    await db.ref().transaction((root) => {
        if (!root) return root;

        const leave = root.leaves?.[uid]?.[leaveId];
        const balance = root.employees?.[uid]?.leaveBalance || { pl: 0, ol: 0, el: 0, lwp: 0 };

        if (!leave) return;
        if (leave.status !== 'pending') return;

        // Deduct
        const days = leave.days;
        const typeKey = leave.type.toLowerCase();

        if (leave.type === 'LWP') {
            balance.lwp = (balance.lwp || 0) + days;
        } else {
            if (balance[typeKey] === undefined) balance[typeKey] = 0;
            balance[typeKey] -= days;
        }

        // Update Leave
        leave.status = 'approved';
        leave.actionedBy = context.auth!.uid;
        leave.actionedAt = admin.database.ServerValue.TIMESTAMP;

        // Write
        if (!root.leaves) root.leaves = {};
        if (!root.leaves[uid]) root.leaves[uid] = {};
        root.leaves[uid][leaveId] = leave;

        if (!root.employees) root.employees = {};
        if (!root.employees[uid]) root.employees[uid] = {};
        root.employees[uid].leaveBalance = balance;

        return root;
    });

    await logAudit(uid, 'APPROVE_LEAVE', { leaveId }, context.auth!.uid);

    return { success: true };
});

// --- FUNCTION: Cancel Leave (Atomic Refund) ---
export const cancelLeave = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    const { uid, leaveId, reason } = data;
    const requestorUid = context.auth.uid;
    const role = (context.auth.token as any).role;

    if (uid !== requestorUid && !['owner', 'md'].includes(role)) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot cancel other users leave');
    }

    await db.ref().transaction((root) => {
        if (!root) return root;

        const leave = root.leaves?.[uid]?.[leaveId];

        if (!leave) return;

        // Strict: Employee can only cancel PENDING
        if (uid === requestorUid && ['owner', 'md'].indexOf(role) === -1) {
            if (leave.status !== 'pending') return;
        }

        const balance = root.employees?.[uid]?.leaveBalance || { pl: 0, ol: 0, el: 0, lwp: 0 };
        const days = leave.days;
        const typeKey = leave.type.toLowerCase();

        if (leave.status === 'approved') {
            if (leave.type === 'LWP') {
                balance.lwp = Math.max(0, (balance.lwp || 0) - days);
            } else {
                if (balance[typeKey] === undefined) balance[typeKey] = 0;
                balance[typeKey] += days;
            }
        }

        leave.status = 'cancelled';
        leave.rejectionReason = reason;
        leave.cancelledBy = requestorUid;
        leave.cancelledAt = admin.database.ServerValue.TIMESTAMP;

        if (!root.leaves) root.leaves = {};
        if (!root.leaves[uid]) root.leaves[uid] = {};
        root.leaves[uid][leaveId] = leave;

        if (!root.employees) root.employees = {};
        if (!root.employees[uid]) root.employees[uid] = {};
        root.employees[uid].leaveBalance = balance;

        return root;
    });

    await logAudit(uid, 'CANCEL_LEAVE', { leaveId, reason }, context.auth!.uid);

    return { success: true };
});

// --- FUNCTION: Approve Attendance (Director Only) ---
export const approveAttendance = functions.https.onCall(async (data, context) => {
    await assertRole(context, ['owner', 'md']);

    const { uid, date, status, reason } = data; // date: YYYY-MM-DD


    if (!uid || !date || !status) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

    const updates: Record<string, any> = {};
    const basePath = `attendance/${date}/${uid}`;

    updates[`${basePath}/status`] = status;
    if (status === 'approved') {
        updates[`${basePath}/approvedAt`] = admin.database.ServerValue.TIMESTAMP;
        updates[`${basePath}/approvedBy`] = context.auth!.uid;
    } else {
        updates[`${basePath}/rejectionReason`] = reason || 'No reason provided';
        updates[`${basePath}/rejectedBy`] = context.auth!.uid;
    }

    // EL ACCRUAL LOGIC (moved from frontend)
    // If Approved AND (Sunday OR Holiday) -> Credit 1 EL
    if (status === 'approved') {
        const dateObj = new Date(date);
        const dayOfWeek = getDay(dateObj); // 0 = Sunday
        const year = format(dateObj, 'yyyy');
        const holidays = await getHolidays(year);
        const isPublicHoliday = holidays.includes(date);

        if (dayOfWeek === 0 || isPublicHoliday) {
            // Credit EL
            await db.ref(`employees/${uid}/leaveBalance/el`).transaction((current) => {
                return (current || 0) + 1;
            });
            // Log specific credit event
            await logAudit(uid, 'CREDIT_EL', { date, reason: 'Worked on Holiday/Sunday' }, context.auth!.uid);
        }
    }

    await db.ref().update(updates);
    await logAudit(uid, 'APPROVE_ATTENDANCE', { date, status }, context.auth!.uid);

    return { success: true };
});

// --- FUNCTION: Mark Attendance (Trusted Time) ---
export const markAttendance = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    const { type, siteName } = data; // 'office' | 'site'
    const uid = context.auth.uid;

    await checkRateLimit(uid, 'markAttendance', 60); // 1m cooldown to prevent double taps

    // SERVER TIME (IST) via Intl
    const today = getTodayIST();

    const ref = db.ref(`attendance/${today}/${uid}`);
    const snapshot = await ref.once('value');
    if (snapshot.exists()) {
        throw new functions.https.HttpsError('already-exists', 'Attendance already marked for today');
    }

    // Capture User Agent securely
    const rawReq = (context as any).rawRequest;
    const userAgent = rawReq ? rawReq.headers['user-agent'] : 'unknown';

    await ref.set({
        uid,
        status: 'present',
        type,
        siteName: siteName || null,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        deviceUserAgent: userAgent || 'unknown'
    });

    return { success: true };
});

// --- FUNCTION: Set Role (Owner Only) ---
export const setRole = functions.https.onCall(async (data, context) => {
    const { targetUid, newRole } = data;

    // Await the async security check
    await assertRole(context, ['owner']);

    await db.ref(`employees/${targetUid}/profile`).update({ role: newRole });
    await admin.firestore().collection('users').doc(targetUid).update({ role: newRole });
    await admin.auth().setCustomUserClaims(targetUid, { role: newRole });

    await logAudit(targetUid, 'SET_ROLE', { newRole }, context.auth!.uid);

    return { success: true };
});
