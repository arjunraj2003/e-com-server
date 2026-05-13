import { Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';
import { AuthRequest } from '../middlewares/auth';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const result = await UserService.updateAvatar(req.user!.userId, file.path);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const listAddresses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await UserService.getAddresses(req.user!.userId);
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
};

export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = await UserService.addAddress(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: address });
  } catch (err) { next(err); }
};

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = await UserService.updateAddress(req.user!.userId, req.params.id, req.body);
    res.json({ success: true, data: address });
  } catch (err) { next(err); }
};

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await UserService.deleteAddress(req.user!.userId, req.params.id);
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
};
