export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

export const validatePassword = (
  password: string,
): PasswordValidationResult => {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: "Şifre alanı boş bırakılamaz." };
  }

  // 1. Minimum 8 karakter
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Şifre en az 8 karakter uzunluğunda olmalıdır.",
    };
  }

  // 2. En az bir küçük harf
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Şifre en az bir küçük harf içermelidir.",
    };
  }

  // 3. En az bir rakam
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Şifre en az bir rakam içermelidir.",
    };
  }

  // 4. En az bir özel karakter (örn: *, @, #, $, !, %, ?, vb.)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "Şifre en az bir özel karakter (*, @, #, $, vb.) içermelidir.",
    };
  }

  return { isValid: true };
};
