import { z } from 'zod'

export const materialSchema = z.object({
  title: z.string().min(1, 'Judul materi wajib diisi').max(200),
  subtitle: z.string().max(500).optional().nullable(),
  drive_url: z.string().min(1, 'Link Google Drive wajib diisi').url('Format URL tidak valid'),
  program_ids: z.array(z.string().uuid()).min(1, 'Minimal pilih 1 program'),
})

export type MaterialInput = z.infer<typeof materialSchema>
