import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const uploadImage = async (
  filePath: string,
  folder = 'ecommerce'
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error(error.message || 'Cloudinary upload failed');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
