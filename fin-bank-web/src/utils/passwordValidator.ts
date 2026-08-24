export const validatePassword = (
  password: string,
): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Şifre en az 8 karakter olmalıdır." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "En az bir küçük harf içermelidir." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "En az bir rakam içermelidir." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "En az bir özel karakter içermelidir (*, @, #, vb.).",
    };
  }
  return { isValid: true };
};
