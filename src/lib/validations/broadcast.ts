import { z } from 'zod'

export const broadcastSchema = z.object({
  title: z.string().min(1, 'Judul broadcast wajib diisi').max(200),
  message: z.string().min(1, 'Isi pesan wajib diisi').max(10000),
  program_ids: z.array(z.string().uuid()).min(1, 'Minimal pilih 1 program'),
})

export type BroadcastInput = z.infer<typeof broadcastSchema>
