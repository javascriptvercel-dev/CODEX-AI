import { customAlphabet } from "nanoid";
const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const nanoid = customAlphabet(alphabet, 20);
export const generatePublicId = () => nanoid();
export const buildInstallCommand = (publicId) => `.install ${publicId}`;
