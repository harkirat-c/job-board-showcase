import authService from '../services/authService.js';
import { loginSchema } from '../validators/authValidator.js';

export default function authController(db) {
    const service = authService(db);

    return {
        async login(req, res) {
            const { error } = loginSchema.validate(req.body);
            if (error) return res.status(400).json({ error: error.details[0].message });

            try {
                const { user, role } = await service.login(req.body);
                res.status(200).json({ message: 'Login successful', user, role });
            } catch (err) {
                res.status(401).json({ error: err.message });
            }
        },
    };
}
