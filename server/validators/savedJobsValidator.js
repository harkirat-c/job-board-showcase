import Joi from "joi";

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
    "string.pattern.base": "must be a valid id",
});

/** Logged-in admin uses id `admin` (not a Mongo ObjectId). Real applicants unchanged. */
const applicantIdForSavedSchema = Joi.alternatives().try(
    Joi.string().valid("admin"),
    objectIdSchema
);

export const saveJobBodySchema = Joi.object({
    applicantId: applicantIdForSavedSchema.required(),
    jobId: objectIdSchema.required(),
}).unknown(false);

export const savedUserIdParamSchema = Joi.object({
    userId: applicantIdForSavedSchema.required(),
});

export const savedDeleteParamSchema = Joi.object({
    userId: applicantIdForSavedSchema.required(),
    jobId: objectIdSchema.required(),
});
