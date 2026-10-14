
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "amenities": {
                  Row: {
                    "category": string | null,"created_at": string,"icon": string | null,"id": string,"is_active": boolean,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"slug": string
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": string,"ip_address": unknown,"metadata": Json | null,"target_id": string | null,"target_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"ip_address"?: unknown,"metadata"?: Json | null,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"ip_address"?: unknown,"metadata"?: Json | null,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"content": string,"created_at": string,"deleted_at": string | null,"id": string,"is_hidden": boolean,"parent_id": string | null,"post_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"content": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"parent_id"?: string | null,"post_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"content"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"parent_id"?: string | null,"post_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"is_read": boolean,"link": string | null,"message": string | null,"title": string,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_read"?: boolean,"link"?: string | null,"message"?: string | null,"title": string,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_read"?: boolean,"link"?: string | null,"message"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["notification_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_amenities": {
                  Row: {
                    "amenity_id": string,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amenity_id": string,"post_id": string
                  }
                  Update: {
                    "amenity_id"?: string,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_amenities_amenity_id_fkey"
      columns: ["amenity_id"]
isOneToOne: false
      referencedRelation: "amenities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_amenities_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_images": {
                  Row: {
                    "alt_text": string | null,"created_at": string,"id": string,"post_id": string,"sort_order": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"created_at"?: string,"id"?: string,"post_id": string,"sort_order"?: number,"storage_path": string
                  }
                  Update: {
                    "alt_text"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string,"sort_order"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_images_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_likes": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_likes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reviews": {
                  Row: {
                    "action": Database["public"]['Enums']["review_action"],"created_at": string,"id": string,"moderator_id": string | null,"post_id": string,"reason": string | null,"revision_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": Database["public"]['Enums']["review_action"],"created_at"?: string,"id"?: string,"moderator_id"?: string | null,"post_id": string,"reason"?: string | null,"revision_id"?: string | null
                  }
                  Update: {
                    "action"?: Database["public"]['Enums']["review_action"],"created_at"?: string,"id"?: string,"moderator_id"?: string | null,"post_id"?: string,"reason"?: string | null,"revision_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reviews_moderator_id_fkey"
      columns: ["moderator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reviews_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reviews_revision_id_fkey"
      columns: ["revision_id"]
isOneToOne: false
      referencedRelation: "post_revisions"
      referencedColumns: ["id"]
    }
                  ]
                },"post_revisions": {
                  Row: {
                    "address": string,"area": number,"created_at": string,"description": string,"id": string,"post_id": string,"price": number,"province": string,"review_note": string | null,"reviewed_at": string | null,"reviewer_id": string | null,"room_type": Database["public"]['Enums']["room_type"],"status": Database["public"]['Enums']["revision_status"],"title": string,"ward": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"area": number,"created_at"?: string,"description": string,"id"?: string,"post_id": string,"price": number,"province": string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"room_type": Database["public"]['Enums']["room_type"],"status"?: Database["public"]['Enums']["revision_status"],"title": string,"ward": string
                  }
                  Update: {
                    "address"?: string,"area"?: number,"created_at"?: string,"description"?: string,"id"?: string,"post_id"?: string,"price"?: number,"province"?: string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"room_type"?: Database["public"]['Enums']["room_type"],"status"?: Database["public"]['Enums']["revision_status"],"title"?: string,"ward"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_revisions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_revisions_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "address": string,"area": number,"author_id": string,"availability_status": Database["public"]['Enums']["availability_status"],"created_at": string,"deleted_at": string | null,"description": string,"expires_at": string | null,"id": string,"price": number,"province": string,"published_at": string | null,"room_type": Database["public"]['Enums']["room_type"],"status": Database["public"]['Enums']["post_status"],"submitted_at": string | null,"title": string,"updated_at": string,"view_count": number,"ward": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"area": number,"author_id": string,"availability_status"?: Database["public"]['Enums']["availability_status"],"created_at"?: string,"deleted_at"?: string | null,"description": string,"expires_at"?: string | null,"id"?: string,"price": number,"province": string,"published_at"?: string | null,"room_type": Database["public"]['Enums']["room_type"],"status"?: Database["public"]['Enums']["post_status"],"submitted_at"?: string | null,"title": string,"updated_at"?: string,"view_count"?: number,"ward": string
                  }
                  Update: {
                    "address"?: string,"area"?: number,"author_id"?: string,"availability_status"?: Database["public"]['Enums']["availability_status"],"created_at"?: string,"deleted_at"?: string | null,"description"?: string,"expires_at"?: string | null,"id"?: string,"price"?: number,"province"?: string,"published_at"?: string | null,"room_type"?: Database["public"]['Enums']["room_type"],"status"?: Database["public"]['Enums']["post_status"],"submitted_at"?: string | null,"title"?: string,"updated_at"?: string,"view_count"?: number,"ward"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"full_name": string | null,"id": string,"phone": string | null,"updated_at": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"phone"?: string | null,"updated_at"?: string,"username": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"updated_at"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"reason": string,"reporter_id": string | null,"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"reason": string,"reporter_id"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"reason"?: string,"reporter_id"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id"?: string,"target_type"?: Database["public"]['Enums']["report_target"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_restrictions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"ends_at": string | null,"id": string,"reason": string,"restriction_type": Database["public"]['Enums']["restriction_type"],"starts_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"ends_at"?: string | null,"id"?: string,"reason": string,"restriction_type": Database["public"]['Enums']["restriction_type"],"starts_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"ends_at"?: string | null,"id"?: string,"reason"?: string,"restriction_type"?: Database["public"]['Enums']["restriction_type"],"starts_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_restrictions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_restrictions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "granted_at": string,"granted_by": string | null,"id": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"granted_by"?: string | null,"id"?: string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"granted_by"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "increment_post_view":
{ Args: { "p_post_id": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_moderator":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "app_role": "member"|"moderator"|"admin","availability_status": "available"|"rented"|"hidden","notification_type": "post_approved"|"post_rejected"|"comment"|"reply"|"like"|"report_result"|"system","post_status": "draft"|"pending"|"published"|"rejected"|"archived","report_status": "pending"|"reviewing"|"resolved"|"dismissed","report_target": "post"|"comment"|"user","restriction_type": "post_ban"|"login_ban"|"full_ban","review_action": "submitted"|"approved"|"rejected"|"hidden"|"restored","revision_status": "pending"|"approved"|"rejected","room_type": "phong_tro"|"chung_cu_mini"|"nha_nguyen_can"|"o_ghep"|"ky_tuc_xa"|"khac"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["member", "moderator", "admin"],"availability_status": ["available", "rented", "hidden"],"notification_type": ["post_approved", "post_rejected", "comment", "reply", "like", "report_result", "system"],"post_status": ["draft", "pending", "published", "rejected", "archived"],"report_status": ["pending", "reviewing", "resolved", "dismissed"],"report_target": ["post", "comment", "user"],"restriction_type": ["post_ban", "login_ban", "full_ban"],"review_action": ["submitted", "approved", "rejected", "hidden", "restored"],"revision_status": ["pending", "approved", "rejected"],"room_type": ["phong_tro", "chung_cu_mini", "nha_nguyen_can", "o_ghep", "ky_tuc_xa", "khac"]
          }
        }
} as const
