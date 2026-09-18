export default function adminOnly(req, res, next) {
    const role = String(req.headers['x-user-role'] || '').trim().toLowerCase();

    if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    return next();
}
