import ImageKit from 'imagekit';
import { getEnvConfig } from './env';

let imagekitInstance: ImageKit | null = null;

export function getImageKit(): ImageKit {
  if (imagekitInstance) {
    return imagekitInstance;
  }

  const env = getEnvConfig();

  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit credentials not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
  }

  imagekitInstance = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });

  return imagekitInstance;
}

export function getImageKitAuthParams() {
  const imagekit = getImageKit();
  return imagekit.getAuthenticationParameters();
}
