import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';
import { Address } from '../models/Address';
import { AppError } from '../middlewares/errorHandler';
import { uploadImage, deleteImage } from '../config/cloudinary';

const userRepo = () => AppDataSource.getRepository(User);
const addrRepo = () => AppDataSource.getRepository(Address);

export const getProfile = async (userId: string) => {
  const user = await userRepo().findOne({
    where: { id: userId },
    relations: ['addresses'],
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string }
) => {
  await userRepo().update(userId, data);
  return userRepo().findOneBy({ id: userId });
};

export const updateAvatar = async (userId: string, filePath: string) => {
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) throw new AppError('User not found', 404);

  // Delete old avatar from Cloudinary if present
  if (user.avatar) {
    const publicId = user.avatar.split('/').pop()?.split('.')[0];
    if (publicId) {
      await deleteImage(`ecommerce/avatars/${publicId}`).catch(() => {});
    }
  }

  const { url } = await uploadImage(filePath, 'ecommerce/avatars');
  await userRepo().update(userId, { avatar: url });
  return { avatar: url };
};

export const getAddresses = async (userId: string) => {
  return addrRepo().find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'ASC' } });
};

export const addAddress = async (
  userId: string,
  data: Partial<Address> & { isDefault?: boolean }
) => {
  const { isDefault, ...rest } = data;
  if (isDefault) {
    await addrRepo().update({ userId }, { isDefault: false });
  }
  const address = addrRepo().create({ ...rest, userId, isDefault: isDefault ?? false });
  return addrRepo().save(address);
};

export const updateAddress = async (
  userId: string,
  addressId: string,
  data: Partial<Address>
) => {
  const addr = await addrRepo().findOneBy({ id: addressId, userId });
  if (!addr) throw new AppError('Address not found', 404);
  if (data.isDefault) {
    await addrRepo().update({ userId }, { isDefault: false });
  }
  Object.assign(addr, data);
  return addrRepo().save(addr);
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const addr = await addrRepo().findOneBy({ id: addressId, userId });
  if (!addr) throw new AppError('Address not found', 404);
  await addrRepo().remove(addr);
};
