
'use server'

import { createClient } from '@/lib/supabase/server'

export type ReportActionResult = {
  ok: boolean
  message: string
}

const REPORT_REASONS: Record<string, string> = {
  suspected_scam: 'Nghi ngờ lừa đảo',
  incorrect_information: 'Thông tin không chính xác',
  prohibited_content: 'Nội dung vi phạm quy định',
  duplicate: 'Tin đăng trùng lặp',
  other: 'Lý do khác',
}

export async function createReportAction(
  postId: string,
  formData: FormData
): Promise<ReportActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      message: 'Bạn cần đăng nhập để báo cáo tin đăng.',
    }
  }

  const normalizedPostId = postId.trim()

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(normalizedPostId)) {
    return {
      ok: false,
      message: 'Tin đăng không hợp lệ.',
    }
  }

  const reason = String(formData.get('reason') ?? '').trim()
  const description = String(
    formData.get('description') ?? ''
  ).trim()

  if (!Object.prototype.hasOwnProperty.call(REPORT_REASONS, reason)) {
    return {
      ok: false,
      message: 'Vui lòng chọn lý do báo cáo hợp lệ.',
    }
  }

  if (description.length > 2000) {
    return {
      ok: false,
      message: 'Mô tả không được vượt quá 2000 ký tự.',
    }
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, author_id, status, deleted_at')
    .eq('id', normalizedPostId)
    .maybeSingle()

  if (postError || !post || post.deleted_at !== null) {
    return {
      ok: false,
      message: 'Không tìm thấy tin đăng cần báo cáo.',
    }
  }

  if (post.author_id === user.id) {
    return {
      ok: false,
      message: 'Bạn không thể báo cáo tin đăng của chính mình.',
    }
  }

  if (post.status !== 'published') {
    return {
      ok: false,
      message: 'Chỉ có thể báo cáo tin đăng đã được công khai.',
    }
  }

  const { error: insertError } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: 'post',
      target_id: post.id,
      reason: REPORT_REASONS[reason],
      description: description || null,
      status: 'pending',
    })

  if (insertError) {
    console.error('Create report failed:', insertError.code)

    return {
      ok: false,
      message: 'Gửi báo cáo thất bại. Vui lòng thử lại.',
    }
  }

  return {
    ok: true,
    message: 'Báo cáo đã được gửi. Cảm ơn bạn đã đóng góp!',
  }
}
