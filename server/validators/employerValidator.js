import Joi from 'joi';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const objectIdSchema = Joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'must be a valid id',
});

const baseFields = {
    name: Joi.string().trim().min(1).max(120),
    companyName: Joi.string().trim().min(1).max(120),
    email: Joi.string().trim().email().max(254),
    password: Joi.string().min(6).max(128),
    phone: Joi.string().trim().min(7).max(30),
    location: Joi.string().trim().min(2).max(100),
    industry: Joi.string().trim().min(2).max(100),
    logo: Joi.string().trim().max(500).allow(''),
};

export const createEmployerSchema = Joi.object({
    ...baseFields,
    name: baseFields.name.required(),
    companyName: baseFields.companyName.required(),
    email: baseFields.email.required(),
    password: baseFields.password.required(),
    phone: baseFields.phone.required(),
    location: baseFields.location.required(),
    industry: baseFields.industry.required(),
}).unknown(false);

export const updateEmployerSchema = Joi.object({
    name: baseFields.name,
    companyName: baseFields.companyName,
    email: baseFields.email,
    password: baseFields.password,
    phone: Joi.string().trim().min(7).max(30).allow(''),
    location: Joi.string().trim().min(2).max(100).allow(''),
    industry: Joi.string().trim().min(2).max(100).allow(''),
    logo: baseFields.logo,
}).unknown(false);

export const employerIdParamSchema = Joi.object({
    id: objectIdSchema.required(),
});
