export default function validateRequest(schema) {
    return (req, res, next) => {
        console.log('Validating request body:', JSON.stringify(req.body));
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            console.log('Validation error:', error.details);
            const messages = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({ error: messages });
        }
        console.log('Validation passed');
        req.body = value;
        next();
    }
}