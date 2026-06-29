import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
  turnstileToken: z
    .string()
    .min(1, 'Verifikasi keamanan diperlukan'),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  university: z
    .string()
    .min(2, 'Nama universitas wajib diisi')
    .max(200, 'Nama universitas terlalu panjang'),
  major: z
    .string()
    .min(2, 'Jurusan wajib diisi')
    .max(200, 'Jurusan terlalu panjang'),
  birthDate: z
    .string()
    .min(1, 'Tanggal lahir wajib diisi')
    .refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z
    .string()
    .min(1, 'Konfirmasi password wajib diisi'),
  token: z
    .string()
    .min(1, 'Token program wajib diisi'),
  turnstileToken: z
    .string()
    .min(1, 'Verifikasi keamanan diperlukan'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password tidak cocok',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Password saat ini wajib diisi'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmNewPassword: z
    .string()
    .min(1, 'Konfirmasi password baru wajib diisi'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Password baru dan konfirmasi tidak cocok',
  path: ['confirmNewPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
