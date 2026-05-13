import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { addAddressSchema, updateProfileSchema } from '../validations/user.schema';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Profile
router.get('/me', authenticate, UserController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), UserController.updateMe);
router.post('/me/avatar', authenticate, upload.single('avatar'), UserController.uploadAvatar);

// Addresses
router.get('/addresses', authenticate, UserController.listAddresses);
router.post('/addresses', authenticate, validate(addAddressSchema), UserController.addAddress);
router.put('/addresses/:id', authenticate, UserController.updateAddress);
router.delete('/addresses/:id', authenticate, UserController.deleteAddress);

export default router;
