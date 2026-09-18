import Joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'must be a valid id',
});

const baseFields = {
    employerId: objectIdSchema,
    applicantId: objectIdSchema,
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().allow('').max(2000),
};

export const createRatingSchema = Joi.object({
    ...baseFields,
    employerId: baseFields.employerId.required(),
    applicantId: baseFields.applicantId.required(),
    rating: baseFields.rating.required(),
}).unknown(false);

export const updateRatingSchema = Joi.object({
    rating: baseFields.rating,
    comment: baseFields.comment,
}).unknown(false);

export const ratingIdParamSchema = Joi.object({
    id: objectIdSchema.required(),
});

export const employerIdParamSchema = Joi.object({
    employerId: objectIdSchema.required(),
});
