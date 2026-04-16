export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      networks: {
        Row: { id: string; name: string; city: string | null; created_at: string };
        Insert: { id?: string; name: string; city?: string | null; created_at?: string };
        Update: { id?: string; name?: string; city?: string | null; created_at?: string };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          network_id: string;
          user_id: string | null;
          name: string;
          owner_name: string | null;
          phone: string | null;
          commune: string | null;
          lat: number | null;
          lng: number | null;
          language_pref: "fr" | "en" | "nl";
          created_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          user_id?: string | null;
          name: string;
          owner_name?: string | null;
          phone?: string | null;
          commune?: string | null;
          lat?: number | null;
          lng?: number | null;
          language_pref?: "fr" | "en" | "nl";
          created_at?: string;
        };
        Update: {
          id?: string;
          network_id?: string;
          user_id?: string | null;
          name?: string;
          owner_name?: string | null;
          phone?: string | null;
          commune?: string | null;
          lat?: number | null;
          lng?: number | null;
          language_pref?: "fr" | "en" | "nl";
          created_at?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          brand: string;
          model: string;
          storage_gb: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          storage_gb?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          storage_gb?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          shop_id: string;
          network_id: string;
          device_id: string;
          available: boolean;
          quantity: number | null;
          price_eur: number | null;
          updated_at: string;
        };
        Insert: {
          shop_id: string;
          network_id?: string;
          device_id: string;
          available?: boolean;
          quantity?: number | null;
          price_eur?: number | null;
          updated_at?: string;
        };
        Update: {
          shop_id?: string;
          network_id?: string;
          device_id?: string;
          available?: boolean;
          quantity?: number | null;
          price_eur?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          network_id: string;
          requesting_shop_id: string;
          device_id: string;
          specs_note: string | null;
          status: "open" | "matched" | "expired";
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          network_id?: string;
          requesting_shop_id?: string;
          device_id: string;
          specs_note?: string | null;
          status?: "open" | "matched" | "expired";
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          network_id?: string;
          requesting_shop_id?: string;
          device_id?: string;
          specs_note?: string | null;
          status?: "open" | "matched" | "expired";
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          network_id: string;
          request_id: string;
          responding_shop_id: string;
          has_device: boolean;
          price_eur: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          network_id?: string;
          request_id: string;
          responding_shop_id?: string;
          has_device: boolean;
          price_eur?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          network_id?: string;
          request_id?: string;
          responding_shop_id?: string;
          has_device?: boolean;
          price_eur?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recovered_sales: {
        Row: {
          id: string;
          network_id: string;
          request_id: string;
          responding_shop_id: string;
          confirmed_at: string;
        };
        Insert: {
          id?: string;
          network_id?: string;
          request_id: string;
          responding_shop_id?: string;
          confirmed_at?: string;
        };
        Update: {
          id?: string;
          network_id?: string;
          request_id?: string;
          responding_shop_id?: string;
          confirmed_at?: string;
        };
        Relationships: [];
      };
      pending_invites: {
        Row: {
          id: string;
          network_id: string;
          invited_by_shop_id: string;
          phone: string;
          token: string;
          name_hint: string | null;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          network_id: string;
          invited_by_shop_id: string;
          phone: string;
          token?: string;
          name_hint?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          network_id?: string;
          invited_by_shop_id?: string;
          phone?: string;
          token?: string;
          name_hint?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Enums: {};
    Functions: {
      auth_network_id: { Args: Record<never, never>; Returns: string };
      auth_shop_id: { Args: Record<never, never>; Returns: string };
      get_invite_by_token: {
        Args: { p_token: string };
        Returns: {
          id: string;
          network_id: string;
          name_hint: string | null;
          expires_at: string;
          accepted_at: string | null;
        }[];
      };
      accept_invite_and_create_shop: {
        Args: {
          p_token: string;
          p_user_id: string;
          p_shop_name: string;
          p_owner_name: string;
          p_commune: string | null;
          p_language_pref: string;
        };
        Returns: { shop_id: string };
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Shop = Tables<"shops">;
export type Device = Tables<"devices">;
export type Inventory = Tables<"inventory">;
export type Request = Tables<"requests">;
export type Response = Tables<"responses">;
export type RecoveredSale = Tables<"recovered_sales">;
export type PendingInvite = Tables<"pending_invites">;
