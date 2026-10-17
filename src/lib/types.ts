export type Role = "admin" | "editor" | "door";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface EventRow {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description_md: string;
  venue: string;
  address: string;
  map_url: string;
  starts_at: string;
  ends_at: string | null;
  cover_image: string;
  lineup: string;
  age_limit: number;
  status: "draft" | "published" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  description: string;
  price: number;
  admits: number;
  quantity: number;
  max_per_order: number;
  sort: number;
  active: number;
}

export interface TicketTypeWithStock extends TicketType {
  sold: number;
  remaining: number;
}

export interface Order {
  id: number;
  ref: string;
  access_token: string;
  event_id: number;
  buyer_name: string;
  email: string;
  phone: string;
  total: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  provider: string;
  provider_ref: string | null;
  marketing_opt_in: number;
  created_at: string;
  paid_at: string | null;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover_image: string;
  category: string;
  author_id: number | null;
  author_name: string;
  event_id: number | null;
  status: "draft" | "published";
  featured: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: number;
  email: string;
  name: string;
  phone: string;
  source: string;
  status: "subscribed" | "unsubscribed";
  token: string;
  created_at: string;
  unsubscribed_at: string | null;
}

export interface Campaign {
  id: number;
  subject: string;
  preheader: string;
  body_md: string;
  audience: string;
  status: "draft" | "sent";
  recipients: number;
  created_by: number | null;
  created_at: string;
  sent_at: string | null;
}
