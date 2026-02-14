import { Request, Response, NextFunction } from 'express';
import { University } from '../models/University';
import { ApiError } from '../utils/apiError';

export const getUniversities = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const universities = await University.find().sort('name');
    res.json({ success: true, data: universities });
  } catch (error) {
    next(error);
  }
};

export const getUniversity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) throw new ApiError(404, 'University not found.');
    res.json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};

export const createUniversity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, domain, departments } = req.body;
    if (!name || !domain) throw new ApiError(400, 'Name and domain are required.');

    const existing = await University.findOne({ domain });
    if (existing) throw new ApiError(409, 'University with this domain already exists.');

    const university = await University.create({
      name,
      domain: domain.toLowerCase(),
      departments: departments || [],
    });

    res.status(201).json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};
