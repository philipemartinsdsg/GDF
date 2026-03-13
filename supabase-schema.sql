-- GDF2 Finance App - Supabase Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query

create table if not exists categories (
  id text primary key,
  name text not null,
  color text not null,
  is_fixed boolean not null default true
);

create table if not exists expenses (
  id text primary key,
  category_id text not null references categories(id),
  budget_item_id text,
  name text not null,
  amount numeric not null,
  date text not null,         -- YYYY-MM-DD
  start_month text not null,  -- YYYY-MM
  duration integer not null default 1,
  description text
);

create table if not exists month_income (
  month text primary key,     -- YYYY-MM
  income numeric not null default 0
);

create table if not exists budgets (
  month text not null,
  category_id text not null references categories(id),
  amount numeric not null default 0,
  is_fixed_budget boolean not null default true,
  is_fixed_category boolean not null default true,
  primary key (month, category_id)
);

create table if not exists budget_items (
  id text primary key,
  month text not null,
  category_id text not null references categories(id),
  name text not null,
  amount numeric not null default 0,
  is_fixed boolean not null default true
);
