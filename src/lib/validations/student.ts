import { z } from 'zod'

export const updateStudentProfileSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  university: z.string().min(2, 'Universitas wajib diisi').max(200),
  major: z.string().min(2, 'Jurusan wajib diisi').max(200),
  birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
})

export const adminUpdateStudentSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  university: z.string().min(2).max(200).optional(),
  major: z.string().min(2).max(200).optional(),
  birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid').optional(),
  program_id: z.string().uuid('Program ID tidak valid').optional(),
})

export const adminCreateStudentSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  university: z.string().min(2, 'Universitas wajib diisi').max(200),
  major: z.string().min(2, 'Jurusan wajib diisi').max(200),
  birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  program_id: z.string().uuid('Program ID tidak valid'),
})

export const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  generate_random: z.boolean().optional().default(false),
}).refine(
  (data) => data.generate_random || (data.new_password && data.new_password.length >= 8),
  { message: 'Masukkan password baru atau pilih generate otomatis', path: ['new_password'] }
)

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>
export type AdminUpdateStudentInput = z.infer<typeof adminUpdateStudentSchema>
export type AdminCreateStudentInput = z.infer<typeof adminCreateStudentSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
