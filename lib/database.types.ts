export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          unit: string
          price: number
          min_stock: number
          created_at: string
        }
        Insert: {
          id: number
          name: string
          unit: string
          price: number
          min_stock?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          unit?: string
          price?: number
          min_stock?: number
          created_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          product_id: number
          quantity: number
          created_at: string
        }
        Insert: {
          product_id: number
          quantity: number
          created_at?: string
        }
        Update: {
          product_id?: number
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          id: number
          hotel_id: number | null
          hotel_name: string | null
          product_id: number
          product_name: string
          product_unit: string
          quantity: number
          price: number
          date: string
          type: "entrada" | "salida"
          created_at: string
        }
        Insert: {
          id: number
          hotel_id?: number | null
          hotel_name?: string | null
          product_id: number
          product_name: string
          product_unit: string
          quantity: number
          price: number
          date: string
          type: "entrada" | "salida"
          created_at?: string
        }
        Update: {
          id?: number
          hotel_id?: number | null
          hotel_name?: string | null
          product_id?: number
          product_name?: string
          product_unit?: string
          quantity?: number
          price?: number
          date?: string
          type?: "entrada" | "salida"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "records_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      health_check: {
        Row: {
          id: number
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          status: string
          created_at?: string
        }
        Update: {
          id?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
