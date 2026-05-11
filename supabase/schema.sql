-- =============================================
-- 뽀독샵 Supabase 스키마 및 초기 데이터
-- =============================================

-- 기존 테이블 초기화
drop table if exists product_categories cascade;
drop table if exists products cascade;
drop table if exists categories cascade;

-- =============================================
-- 카테고리 테이블
-- =============================================
create table categories (
  id          serial primary key,
  name        text not null,
  slug        text not null unique,
  icon        text not null default '📦',
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

-- =============================================
-- 상품 테이블
-- =============================================
create table products (
  id             text primary key,
  name           text not null,
  price          integer not null,
  original_price integer,
  emoji          text not null default '📦',
  bg_color       text not null default 'bg-gray-50',
  is_new         boolean not null default false,
  is_best        boolean not null default false,
  badge          text,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now()
);

-- =============================================
-- 상품-카테고리 연결 테이블 (다대다)
-- =============================================
create table product_categories (
  product_id  text references products(id) on delete cascade,
  category_id integer references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- =============================================
-- 카테고리 초기 데이터
-- =============================================
insert into categories (name, slug, icon, sort_order) values
('생활용품',        'life',      '🏠', 1),
('주방용품',        'kitchen',   '🍳', 2),
('세제/세탁용품',   'detergent', '🧺', 3),
('세제류',          'cleaner',   '🧹', 4),
('식품류',          'food',      '🥗', 5),
('뷰티/화장품',     'beauty',    '💄', 6),
('스포츠/레저용품', 'sports',    '⚽', 7),
('기타용품',        'etc',       '📦', 8);

-- =============================================
-- 상품 초기 데이터
-- =============================================
insert into products (id, name, price, original_price, emoji, bg_color, is_new, is_best, badge, is_visible) values
('1',  '자연 문디어덱스청크(뷰티) 250ml', 4500, 6000,  '🧴', 'bg-pink-50',   true,  false, null,   true),
('2',  '자연 디즈펙트소금 500g',          3000, null,  '🧂', 'bg-blue-50',   true,  false, null,   true),
('3',  '자연 트래빈 스무디 750ml',        2500, null,  '🥤', 'bg-green-50',  true,  false, null,   true),
('4',  '자연 쉐이크 엘레비안 800ml',      1800, null,  '🫙', 'bg-yellow-50', true,  false, null,   true),
('5',  '자연 코라탑세트',                 6000, 8000,  '🎁', 'bg-purple-50', true,  false, null,   true),
('6',  '자연 두정소금 2개 세트',          7000, null,  '🧂', 'bg-orange-50', true,  false, null,   true),
('7',  '2080크림칫솔 90g',               1200, null,  '🪥', 'bg-cyan-50',   true,  false, null,   true),
('8',  '2080스크럽치약 팩트',             2200, 3000,  '🦷', 'bg-teal-50',   true,  false, null,   true),
('9',  '프리미엄 향수 50ml',             16000, null,  '🌸', 'bg-rose-50',   false, true,  'BEST', true),
('10', '천연 세탁세제 1.5L',              8500, 12000, '🫧', 'bg-blue-50',   false, true,  'BEST', true),
('11', '바이오 주방세제 500ml',            3500, null,  '🧽', 'bg-lime-50',   false, true,  'BEST', true),
('12', '스포츠 물병 700ml',               5500, 7000,  '🍶', 'bg-indigo-50', false, true,  'SALE', true);

-- =============================================
-- 상품-카테고리 연결 데이터
-- =============================================
insert into product_categories (product_id, category_id)
select p.id, c.id from (values
  ('1',  'beauty'),
  ('2',  'kitchen'),
  ('3',  'food'),
  ('4',  'food'),
  ('5',  'etc'),
  ('6',  'kitchen'),
  ('7',  'life'),
  ('8',  'life'),
  ('9',  'beauty'),
  ('10', 'detergent'),
  ('11', 'cleaner'),
  ('12', 'sports')
) as p(id, slug)
join categories c on c.slug = p.slug;
