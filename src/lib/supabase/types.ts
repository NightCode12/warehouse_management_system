export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      barcode_aliases: {
        Row: {
          created_at: string | null
          created_by: string | null
          external_barcode: string
          id: string
          inventory_id: string | null
          sku: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          external_barcode: string
          id?: string
          inventory_id?: string | null
          sku: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          external_barcode?: string
          id?: string
          inventory_id?: string | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "barcode_aliases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_aliases_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          billing_period: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          is_invoiced: boolean | null
          order_id: string | null
          quantity: number | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          billing_period?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          is_invoiced?: boolean | null
          order_id?: string | null
          quantity?: number | null
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          billing_period?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_invoiced?: boolean | null
          order_id?: string | null
          quantity?: number | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rules: {
        Row: {
          charge_type: string
          client_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          rule_name: string
          supply_sku: string | null
          trigger_type: string
          trigger_value: string | null
          unit_cost: number
        }
        Insert: {
          charge_type: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          rule_name: string
          supply_sku?: string | null
          trigger_type: string
          trigger_value?: string | null
          unit_cost: number
        }
        Update: {
          charge_type?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          rule_name?: string
          supply_sku?: string | null
          trigger_type?: string
          trigger_value?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          color: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          color?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          color?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          barcode: string | null
          client_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          last_updated: string | null
          location_code: string | null
          location_id: string | null
          product_name: string
          quantity: number
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sku: string
          threshold: number | null
          variant: string | null
        }
        Insert: {
          barcode?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          location_code?: string | null
          location_id?: string | null
          product_name: string
          quantity?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku: string
          threshold?: number | null
          variant?: string | null
        }
        Update: {
          barcode?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          location_code?: string | null
          location_id?: string | null
          product_name?: string
          quantity?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string
          threshold?: number | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          aisle: string
          bin: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          shelf: string
        }
        Insert: {
          aisle: string
          bin: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shelf: string
        }
        Update: {
          aisle?: string
          bin?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shelf?: string
        }
        Relationships: []
      }
      manual_charges: {
        Row: {
          billing_period: string | null
          charge_type: string | null
          client_id: string | null
          created_at: string | null
          description: string
          entered_by: string | null
          id: string
          is_invoiced: boolean | null
          quantity: number | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          billing_period?: string | null
          charge_type?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          entered_by?: string | null
          id?: string
          is_invoiced?: boolean | null
          quantity?: number | null
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          billing_period?: string | null
          charge_type?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          entered_by?: string | null
          id?: string
          is_invoiced?: boolean | null
          quantity?: number | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_charges_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_picked: boolean | null
          location_code: string | null
          order_id: string | null
          picked_at: string | null
          picked_by: string | null
          picked_quantity: number | null
          product_name: string
          quantity: number
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sku: string
          variant: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_picked?: boolean | null
          location_code?: string | null
          order_id?: string | null
          picked_at?: string | null
          picked_by?: string | null
          picked_quantity?: number | null
          product_name: string
          quantity?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku: string
          variant?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_picked?: boolean | null
          location_code?: string | null
          order_id?: string | null
          picked_at?: string | null
          picked_by?: string | null
          picked_quantity?: number | null
          product_name?: string
          quantity?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_picked_by_fkey"
            columns: ["picked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          is_carryover: boolean | null
          notes: string | null
          order_number: string
          packed_at: string | null
          priority: string
          shipped_at: string | null
          shipping_address: Json | null
          shopify_created_at: string | null
          shopify_order_id: string | null
          status: string
          store_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          is_carryover?: boolean | null
          notes?: string | null
          order_number: string
          packed_at?: string | null
          priority?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shopify_created_at?: string | null
          shopify_order_id?: string | null
          status?: string
          store_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          is_carryover?: boolean | null
          notes?: string | null
          order_number?: string
          packed_at?: string | null
          priority?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shopify_created_at?: string | null
          shopify_order_id?: string | null
          status?: string
          store_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_supplies: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          id: string
          name: string
          owner_client_id: string | null
          quantity_on_hand: number | null
          reorder_threshold: number | null
          size_description: string | null
          sku: string | null
          supply_type: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          name: string
          owner_client_id?: string | null
          quantity_on_hand?: number | null
          reorder_threshold?: number | null
          size_description?: string | null
          sku?: string | null
          supply_type: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          name?: string
          owner_client_id?: string | null
          quantity_on_hand?: number | null
          reorder_threshold?: number | null
          size_description?: string | null
          sku?: string | null
          supply_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_supplies_owner_client_id_fkey"
            columns: ["owner_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          location_code: string | null
          location_id: string | null
          product_name: string | null
          quantity_expected: number | null
          quantity_received: number
          receipt_id: string | null
          sku: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          location_code?: string | null
          location_id?: string | null
          product_name?: string | null
          quantity_expected?: number | null
          quantity_received?: number
          receipt_id?: string | null
          sku: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          location_code?: string | null
          location_id?: string | null
          product_name?: string | null
          quantity_expected?: number | null
          quantity_received?: number
          receipt_id?: string | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiving_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receiving_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_receipts: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          received_by: string | null
          reference_number: string | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          received_by?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          received_by?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receiving_receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          access_token: string | null
          api_key: string | null
          api_secret: string | null
          color: string | null
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          shopify_store_id: string | null
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          color?: string | null
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          shopify_store_id?: string | null
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          color?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          shopify_store_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
