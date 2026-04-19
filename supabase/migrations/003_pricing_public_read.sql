-- pricing_default / pricing_country를 비로그인 방문자도 조회할 수 있도록 공개 read로 변경
-- pricing_academy는 학원 내부 오버라이드 정보이므로 기존 member_select 정책 유지.
-- 이유: 랜딩(/pricing)에서 비로그인 방문자가 가격 카드를 볼 수 있어야 결제 유입이 가능하다.
-- resolve_price RPC는 기본 + 국가 가격을 읽으므로 두 테이블 모두 열어준다.

drop policy if exists pricing_default_read_all on public.pricing_default;
drop policy if exists pricing_country_read_all on public.pricing_country;

create policy pricing_default_read_all on public.pricing_default
  for select using (true);

create policy pricing_country_read_all on public.pricing_country
  for select using (true);
