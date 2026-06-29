import { z } from 'zod'

export const programSchema = z.object({
  name: z.string().min(1, 'Nama program wajib diisi').max(200),
  token: z.string().min(1, 'Token wajib diisi').max(100),
  token_valid_from: z.string().min(1, 'Tanggal mulai berlaku wajib diisi'),
  token_valid_until: z.string().min(1, 'Tanggal berakhir wajib diisi'),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  drive_access_notice: z.string().max(1000).optional().nullable(),
  drive_access_form_url: z.string().url('Format URL tidak valid').optional().nullable().or(z.literal('')),
  is_active: z.boolean().default(true),
}).refine(
  (data) => new Date(data.token_valid_from) < new Date(data.token_valid_until),
  { message: 'Tanggal mulai harus sebelum tanggal berakhir', path: ['token_valid_until'] }
)

export type ProgramInput = z.infer<typeof programSchema>
