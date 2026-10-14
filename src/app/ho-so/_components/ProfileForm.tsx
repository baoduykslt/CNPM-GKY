'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  updateProfileAction,
  type ProfileActionState,
} from '@/lib/actions/profile'
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  initialData: UpdateProfileInput
  email: string
  username: string
}

export function ProfileForm({ initialData, email, username }: Props) {
  const [state, setState] = useState<ProfileActionState | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialData,
  })

  const onSubmit = (data: UpdateProfileInput) => {
    const formData = new FormData()
    formData.set('fullName', data.fullName)
    formData.set('phone', data.phone ?? '')
    formData.set('bio', data.bio ?? '')

    startTransition(async () => {
      const result = await updateProfileAction(null, formData)
      setState(result)
      if (result.ok) {
        toast.success(result.message)
      }
    })
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {state && !state.ok && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Read-only fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input value={email} disabled className="mt-2 bg-slate-50" />
              <p className="mt-1 text-xs text-slate-500">
                Email không thể thay đổi
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <Input value={username} disabled className="mt-2 bg-slate-50" />
              <p className="mt-1 text-xs text-slate-500">
                Username không thể thay đổi
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên</FormLabel>
                <FormControl>
                  <Input placeholder="Nguyễn Văn A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0912345678"
                    autoComplete="tel"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Dùng để liên hệ khi có người quan tâm tin đăng của bạn
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giới thiệu</FormLabel>
                <FormControl>
                  <textarea
                    rows={4}
                    placeholder="Giới thiệu ngắn về bản thân..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Tối đa 500 ký tự</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </form>
      </Form>
    </section>
  )
}