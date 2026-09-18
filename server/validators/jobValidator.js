import joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;
const objectIdSchema = joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'must be a valid id',
});

const jobFieldsSchema = {
    title: joi.string().trim().min(3).max(100),
    description: joi.string().trim().min(10).max(1500),
    location: joi.string().trim().min(2).max(100),
    payRange: joi.object({
        low: joi.number().min(0).required(),
        high: joi.number().min(joi.ref('low')).required()
    }),
    skills: joi.array().items(joi.string().trim().min(1).max(100)).max(50),
    employerId: objectIdSchema,
    additionalQuestions: joi.array().items(joi.string().trim().min(3).max(200)).max(10),
    postedAt: joi.date().iso(),
    isClosed: joi.boolean()
};

export const createJobSchema = joi.object({
    ...jobFieldsSchema,
    title: jobFieldsSchema.title.required(),
    description: jobFieldsSchema.description.required(),
    location: jobFieldsSchema.location.required(),
    payRange: jobFieldsSchema.payRange.required(),
    skills: jobFieldsSchema.skills.required(),
    employerId: jobFieldsSchema.employerId.required(),
    additionalQuestions: jobFieldsSchema.additionalQuestions.required()
}).unknown(false);

export const updateJobSchema = joi.object(jobFieldsSchema).unknown(false);

export const jobIdParamSchema = joi.object({
    id: objectIdSchema.required(),
});

export const applicantIdParamSchema = joi.object({
    applicantId: objectIdSchema.required(),
});

export const employerIdParamSchema = joi.object({
    employerId: objectIdSchema.required(),
});