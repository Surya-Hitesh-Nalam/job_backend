import argon2 from 'argon2';

export const hashPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const comparePassword = async (plain: string, hashed: string) => {
  return await argon2.verify(hashed, plain);
};
