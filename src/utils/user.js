export function getCurrentUser() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;

        const user = JSON.parse(raw);
        const id = user?.id || user?._id || user?.id?.$oid || user?._id?.$oid;
        return id ? { ...user, id } : null;
    } catch {
        return null;
    }
}

export function getUserRole(user) {
    if (!user) return null;
    if (user.role) return user.role;
    if (user.industry || user.companyName || user.logo) return 'employer';
    if (user.firstName || user.lastName || user.skills || user.profilePicture || typeof user.name === 'object') return 'applicant';
    return null;
}

export function isAdmin(user) {
    return getUserRole(user) === "admin";
}

/** Saved jobs / My Applications stars: same UX as applicants for admins. */
export function hasApplicantPortalAccess(user) {
    const role = getUserRole(user);
    return role === "applicant" || role === "admin";
}

/** Real Mongo ObjectId string (24 hex). Login id `admin` is not one. */
export function isMongoObjectIdString(id) {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

export function getUserDisplayName(user) {
    if (!user) return '';

    if (typeof user.name === 'string' && user.name.trim()) {
        return user.name.trim();
    }

    if (user.name && typeof user.name === 'object') {
        const first = user.name.first ?? user.name.firstName ?? '';
        const last = user.name.last ?? user.name.lastName ?? '';
        const combined = `${first} ${last}`.trim();
        if (combined) return combined;
    }

    if (user.firstName || user.lastName) {
        return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    }

    return user.companyName || user.email || 'Signed in user';
}

export function getUserInitial(user) {
    const displayName = getUserDisplayName(user);
    return displayName?.trim()?.[0]?.toUpperCase() ?? '?';
}
