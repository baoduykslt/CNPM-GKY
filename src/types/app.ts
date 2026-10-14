// =====================================================================
// Type helper cho business objects
// =====================================================================

import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostImage = Database['public']['Tables']['post_images']['Row']
export type Amenity = Database['public']['Tables']['amenities']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type AppRole = Database['public']['Enums']['app_role']
export type PostStatus = Database['public']['Enums']['post_status']
export type AvailabilityStatus = Database['public']['Enums']['availability_status']
export type RoomType = Database['public']['Enums']['room_type']
export type NotificationType = Database['public']['Enums']['notification_type']