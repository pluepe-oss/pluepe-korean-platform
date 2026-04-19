-- 시험 문항 테이블 + RLS + 시드 데이터
-- correct_answer는 RLS로 따로 숨기지 않고, API Route에서 select 컬럼을 제한해 클라이언트 노출을 차단한다.
-- RLS는 is_published=true 문항을 모든 인증자에게 읽기 허용하고, 쓰기는 master만 허용한다.

create table if not exists public.questions (
  id               uuid primary key default gen_random_uuid(),
  exam_type        text not null check (exam_type in ('topik1','topik2','eps-topik')),
  section          text not null check (section in ('listening','reading')),
  question_number  int  not null,
  question_text    text not null,
  passage          text,
  audio_url        text,
  image_url        text,
  options          jsonb not null,
  correct_answer   int  not null check (correct_answer between 1 and 4),
  explanation      text,
  category         text,
  difficulty       int  check (difficulty between 1 and 3),
  is_free          boolean not null default false,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (exam_type, section, question_number)
);

create index if not exists idx_questions_exam_section
  on public.questions(exam_type, section, question_number);
create index if not exists idx_questions_is_free
  on public.questions(is_free);

alter table public.questions enable row level security;

drop policy if exists questions_published_read on public.questions;
drop policy if exists questions_master_all     on public.questions;

create policy questions_published_read on public.questions
  for select using (
    auth.uid() is not null and (is_published or public.is_master())
  );

create policy questions_master_all on public.questions
  for all using (public.is_master()) with check (public.is_master());

-- 시드 데이터. 중복 실행 방지를 위해 기존 샘플을 제거한 뒤 삽입한다.
delete from public.questions where question_text like '[SEED]%';

insert into public.questions
  (exam_type, section, question_number, question_text, passage, options, correct_answer, explanation, category, difficulty, is_free)
values
  -- TOPIK 1 reading free 5
  ('topik1','reading',1,
   '[SEED] 다음 빈칸에 들어갈 가장 알맞은 것을 고르십시오. 저는 아침에 빵( ) 우유를 먹습니다.',
   null,
   '[{"num":1,"text":"을"},{"num":2,"text":"과"},{"num":3,"text":"에서"},{"num":4,"text":"보다"}]'::jsonb,
   2,
   '과/와는 두 명사를 대등하게 연결할 때 사용합니다. 빵과 우유가 자연스럽습니다.',
   'grammar', 1, true),

  ('topik1','reading',2,
   '[SEED] 다음 중 도서관에서 할 수 있는 행동이 아닌 것을 고르십시오.',
   null,
   '[{"num":1,"text":"책을 빌리다"},{"num":2,"text":"공부를 하다"},{"num":3,"text":"큰 소리로 노래를 부르다"},{"num":4,"text":"책을 읽다"}]'::jsonb,
   3,
   '도서관은 조용히 해야 하는 공공장소입니다. 큰 소리로 노래를 부르는 것은 적절하지 않습니다.',
   'vocabulary', 1, true),

  ('topik1','reading',3,
   '[SEED] 다음 글의 목적으로 알맞은 것을 고르십시오.',
   '민수 씨, 이번 주 토요일에 우리 집에서 생일 파티를 해요. 오후 6시에 시작해요. 꼭 오세요. - 지수',
   '[{"num":1,"text":"물건을 사려고"},{"num":2,"text":"길을 물어보려고"},{"num":3,"text":"친구를 초대하려고"},{"num":4,"text":"선생님께 인사하려고"}]'::jsonb,
   3,
   '지문에서 우리 집에 놀러 오세요 라는 표현이 나오므로 친구를 초대하려는 목적입니다.',
   'passage_comprehension', 2, true),

  ('topik1','reading',4,
   '[SEED] 빈칸에 들어갈 알맞은 단어를 고르십시오. 날씨가 추우니까 ( )을/를 입으세요.',
   null,
   '[{"num":1,"text":"수영복"},{"num":2,"text":"코트"},{"num":3,"text":"반팔"},{"num":4,"text":"모자"}]'::jsonb,
   2,
   '추운 날씨에는 따뜻한 코트를 입는 것이 적절합니다.',
   'vocabulary', 1, true),

  ('topik1','reading',5,
   '[SEED] 대화의 순서로 맞는 것을 고르십시오. (가) 네, 5번 버스를 타세요. (나) 실례합니다. 시청에 어떻게 가요? (다) 감사합니다. (라) 버스 정류장은 저쪽에 있어요.',
   null,
   '[{"num":1,"text":"나-가-라-다"},{"num":2,"text":"나-라-가-다"},{"num":3,"text":"라-나-가-다"},{"num":4,"text":"가-나-라-다"}]'::jsonb,
   1,
   '질문(나) 다음에 답변 버스 번호(가), 추가 정보 정류장 위치(라), 마지막에 감사 인사(다) 순서가 자연스럽습니다.',
   'conversation', 2, true),

  -- TOPIK 1 reading paid 3
  ('topik1','reading',6,
   '[SEED] 글의 내용과 같은 것을 고르십시오.',
   '저는 한국어를 배우는 외국인입니다. 매일 학원에 가서 선생님께 한국어를 배웁니다. 수업은 오전 9시부터 12시까지입니다. 오후에는 친구들과 같이 숙제를 합니다.',
   '[{"num":1,"text":"수업은 오후에 시작한다"},{"num":2,"text":"혼자 숙제를 한다"},{"num":3,"text":"학원에서 한국어를 배운다"},{"num":4,"text":"선생님과 숙제를 한다"}]'::jsonb,
   3,
   '본문에 매일 학원에 가서 선생님께 한국어를 배웁니다 라고 명시되어 있습니다.',
   'passage_comprehension', 2, false),

  ('topik1','reading',7,
   '[SEED] 밑줄 친 부분과 의미가 비슷한 것을 고르십시오. 오늘은 날씨가 맑습니다.',
   null,
   '[{"num":1,"text":"흐립니다"},{"num":2,"text":"춥습니다"},{"num":3,"text":"화창합니다"},{"num":4,"text":"덥습니다"}]'::jsonb,
   3,
   '맑다는 구름이 없고 하늘이 깨끗한 상태로, 화창하다와 의미가 가장 가깝습니다.',
   'vocabulary', 2, false),

  ('topik1','reading',8,
   '[SEED] 다음 글의 주제로 가장 알맞은 것을 고르십시오.',
   '한국에서는 식사할 때 숟가락과 젓가락을 같이 사용합니다. 밥과 국은 숟가락으로 먹고, 반찬은 젓가락으로 먹습니다. 또한 어른이 먼저 드시기 전에 먼저 먹지 않는 것이 예의입니다.',
   '[{"num":1,"text":"한국 음식의 종류"},{"num":2,"text":"한국의 식사 예절"},{"num":3,"text":"젓가락 사용법"},{"num":4,"text":"어른과의 대화"}]'::jsonb,
   2,
   '지문은 식기 사용법과 어른보다 먼저 먹지 않는 예의를 설명하므로 식사 예절이 주제입니다.',
   'inference', 3, false),

  -- EPS-TOPIK reading free 3
  ('eps-topik','reading',1,
   '[SEED] 작업장에서 반드시 써야 하는 것은 무엇입니까?',
   null,
   '[{"num":1,"text":"모자"},{"num":2,"text":"안전모"},{"num":3,"text":"선글라스"},{"num":4,"text":"목도리"}]'::jsonb,
   2,
   '작업장에서는 머리 보호를 위해 안전모를 반드시 착용해야 합니다.',
   'workplace_safety', 1, true),

  ('eps-topik','reading',2,
   '[SEED] 출입 금지 표지판의 의미로 맞는 것을 고르십시오.',
   null,
   '[{"num":1,"text":"들어가도 된다"},{"num":2,"text":"여기에서 일한다"},{"num":3,"text":"들어가면 안 된다"},{"num":4,"text":"휴식 공간이다"}]'::jsonb,
   3,
   '출입 금지는 들어가면 안 된다는 의미입니다.',
   'sign_comprehension', 1, true),

  ('eps-topik','reading',3,
   '[SEED] 빈칸에 들어갈 알맞은 것을 고르십시오. 사장님께서 내일 아침 8시까지 ( ) 라고 말씀하셨습니다.',
   null,
   '[{"num":1,"text":"주무세요"},{"num":2,"text":"드세요"},{"num":3,"text":"출근하세요"},{"num":4,"text":"쉬세요"}]'::jsonb,
   3,
   '작업장에서 정해진 시각까지 가야 하는 것은 출근하세요입니다.',
   'workplace_vocabulary', 2, true),

  -- TOPIK 1 listening free 3. audio_url is null; script is in question_text.
  ('topik1','listening',1,
   '[SEED] 다음을 듣고 이어지는 말로 알맞은 것을 고르십시오. (음성) 안녕하세요. 처음 뵙겠습니다.',
   null,
   '[{"num":1,"text":"안녕히 가세요"},{"num":2,"text":"만나서 반갑습니다"},{"num":3,"text":"잘 먹겠습니다"},{"num":4,"text":"고맙습니다"}]'::jsonb,
   2,
   '처음 만났을 때의 자연스러운 답은 만나서 반갑습니다입니다.',
   'greeting', 1, true),

  ('topik1','listening',2,
   '[SEED] 다음을 듣고 무엇에 대한 이야기인지 고르십시오. (음성) 사과 세 개, 바나나 두 개 주세요.',
   null,
   '[{"num":1,"text":"쇼핑"},{"num":2,"text":"운동"},{"num":3,"text":"공부"},{"num":4,"text":"여행"}]'::jsonb,
   1,
   '과일을 사고 있으므로 쇼핑에 관한 대화입니다.',
   'situation', 1, true),

  ('topik1','listening',3,
   '[SEED] 다음 대화를 듣고 여자가 무엇을 하는지 고르십시오. (음성) 남자: 뭐 하세요? 여자: 책을 읽고 있어요.',
   null,
   '[{"num":1,"text":"요리를 한다"},{"num":2,"text":"책을 읽는다"},{"num":3,"text":"잠을 잔다"},{"num":4,"text":"운동을 한다"}]'::jsonb,
   2,
   '여자가 책을 읽고 있어요 라고 말했으므로 정답은 2번입니다.',
   'conversation', 1, true);
