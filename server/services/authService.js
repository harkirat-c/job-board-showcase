import bcrypt from 'bcryptjs';

export default function authService(db) {
    const applicants = db.collection('applicants');
    const employers = db.collection('employers');
    const admins = db.collection('admins');

    return {
        async login({ email, password }) {
            // Check admins collection
            const admin = await admins.findOne({ email });
            if (admin) {
                const match = await bcrypt.compare(password, admin.password);
                if (!match) throw new Error('Invalid email or password');
                return {
                    user: {
                        id: admin._id?.toString?.() ?? admin._id,
                        name: admin.name || 'Admin',
                        email: admin.email,
                    },
                    role: 'admin',
                };
            }

            // Check applicants collection
            const applicant = await applicants.findOne({ email });
            if (applicant) {
                const match = await bcrypt.compare(password, applicant.password);
                if (!match) throw new Error('Invalid email or password');
                return {
                    user: {
                        id: applicant._id?.toString?.() ?? applicant._id,
                        name: `${applicant.name?.first ?? applicant.firstName ?? ''} ${applicant.name?.last ?? applicant.lastName ?? ''}`.trim() || email,
                        email: applicant.email,
                        phone: applicant.phone,
                        skills: applicant.skills ?? [],
                        profilePicture: applicant.profilePicture ?? applicant.profile ?? '',
                        location: applicant.location,
                    },
                    role: 'applicant',
                };
            }

            // Check employers collection
            const employer = await employers.findOne({ email });
            if (employer) {
                const match = await bcrypt.compare(password, employer.password);
                if (!match) throw new Error('Invalid email or password');
                return {
                    user: {
                        id: employer._id?.toString?.() ?? employer._id,
                        name: employer.companyName || employer.name || email,
                        email: employer.email,
                        phone: employer.phone,
                        location: employer.location,
                        industry: employer.industry,
                        logo: employer.logo ?? employer.profilePicture ?? '',
                    },
                    role: 'employer',
                };
            }

            throw new Error('Invalid email or password');
        },
    };
}
