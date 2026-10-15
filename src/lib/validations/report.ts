import { z } from "zod";

export const reportReasonEnum = [
  "scam",
  "duplicate",
  "wrong_info",
  "rented",
  "other",
] as const;

export const REPORT_REASONS: {
  value: (typeof reportReasonEnum)[number];
  label: string;
}[] = [
  { value: "wrong_info", label: "Thông tin phòng không đúng thực tế" },
  { value: "rented", label: "Phòng đã được cho thuê" },
  { value: "scam", label: "Dấu hiệu lừa đảo / thu cọc bất thường" },
  { value: "duplicate", label: "Tin đăng trùng lặp / Spam" },
  { value: "other", label: "Lý do khác" },
];

export const createReportSchema = z.object({
  postId: z.string().uuid("ID bài đăng không hợp lệ"),
  reason: z.enum(reportReasonEnum, {
    message: "Vui lòng chọn lý do báo cáo",
  }),
  description: z
    .string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;