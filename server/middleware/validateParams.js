export default function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, { abortEarly: false });
        if (error) {
            const messages = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: messages });
        }

        req.params = value;
        next();
    };
}
