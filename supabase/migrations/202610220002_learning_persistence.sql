create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null default ''
);

create table if not exists public.course_topics (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  unique (course_id, title)
);

insert into public.courses (id, title, description)
values (
  'data-structures',
  'Data Structures',
  'Foundations and applications of core data structures.'
)
on conflict (id) do update
set title = excluded.title, description = excluded.description;

insert into public.course_topics (id, course_id, title, description, sort_order)
values
  ('arrays', 'data-structures', 'Arrays', 'Indexing, traversal, and common array operations.', 1),
  ('linked-lists', 'data-structures', 'Linked Lists', 'Nodes, pointers, traversal, insertion, and reversal.', 2),
  ('stacks', 'data-structures', 'Stacks', 'Last-in, first-out ordering and stack operations.', 3),
  ('queues', 'data-structures', 'Queues', 'First-in, first-out ordering and queue operations.', 4),
  ('trees', 'data-structures', 'Trees', 'Rooted structure, traversal, and binary search trees.', 5)
on conflict (id) do update
set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

create table if not exists public.learning_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.course_topics (id),
  question_id text not null check (char_length(question_id) between 1 and 100),
  selected_option smallint not null check (selected_option between 0 and 3),
  is_correct boolean not null,
  attempted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists learning_attempts_user_topic_date
  on public.learning_attempts (user_id, topic_id, attempted_at desc);

create table if not exists public.topic_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.course_topics (id),
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct between 0 and attempts),
  recent_attempts integer not null default 0 check (recent_attempts >= 0),
  recent_correct integer not null default 0 check (recent_correct between 0 and recent_attempts),
  cumulative_accuracy numeric(5,2),
  recent_accuracy numeric(5,2),
  mastery numeric(5,2),
  status text not null default 'insufficient-evidence'
    check (status in ('insufficient-evidence', 'low', 'developing', 'high')),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table if not exists public.revision_tasks (
  task_id text not null check (char_length(task_id) between 1 and 120),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.course_topics (id),
  title text not null check (char_length(title) between 1 and 180),
  rationale text not null default '' check (char_length(rationale) <= 500),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'review')),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create table if not exists public.uploaded_study_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.course_topics (id),
  file_name text not null check (char_length(file_name) <= 255),
  media_type text not null check (media_type in ('application/pdf', 'text/plain')),
  file_size_bytes integer not null check (file_size_bytes between 1 and 10485760),
  extracted_characters integer not null check (extracted_characters between 1 and 12000),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.course_topics enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.revision_tasks enable row level security;
alter table public.uploaded_study_materials enable row level security;

revoke all on public.courses, public.course_topics from anon, authenticated;
grant select on public.courses, public.course_topics to anon, authenticated;
create policy "Course catalog is readable"
  on public.courses for select to anon, authenticated using (true);
create policy "Course topics are readable"
  on public.course_topics for select to anon, authenticated using (true);

revoke all on public.learning_attempts, public.topic_mastery,
  public.revision_tasks, public.uploaded_study_materials from anon;
grant select, delete on public.learning_attempts to authenticated;
grant select on public.topic_mastery to authenticated;
grant select, insert, update, delete on public.revision_tasks to authenticated;
grant select, insert, delete on public.uploaded_study_materials to authenticated;

create policy "Users can read their own learning attempts"
  on public.learning_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can delete their own learning attempts"
  on public.learning_attempts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own topic mastery"
  on public.topic_mastery for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can manage their own revision tasks"
  on public.revision_tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own uploaded material metadata"
  on public.uploaded_study_materials for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own uploaded material metadata"
  on public.uploaded_study_materials for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own uploaded material metadata"
  on public.uploaded_study_materials for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.refresh_topic_mastery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user uuid;
  affected_topic text;
  attempt_count integer;
  correct_count integer;
  recent_count integer;
  recent_correct_count integer;
  cumulative numeric(5,2);
  recent numeric(5,2);
  mastery_raw numeric;
  mastery_score numeric(5,2);
  mastery_status text;
begin
  if tg_op = 'DELETE' then
    affected_user := old.user_id;
    affected_topic := old.topic_id;
  else
    affected_user := new.user_id;
    affected_topic := new.topic_id;
  end if;

  select count(*), count(*) filter (where is_correct)
    into attempt_count, correct_count
    from public.learning_attempts
    where user_id = affected_user and topic_id = affected_topic;

  select count(*), count(*) filter (where is_correct)
    into recent_count, recent_correct_count
    from (
      select is_correct
      from public.learning_attempts
      where user_id = affected_user and topic_id = affected_topic
      order by attempted_at desc, created_at desc
      limit 5
    ) recent_attempts;

  cumulative := case when attempt_count = 0 then null
    else round(correct_count::numeric / attempt_count * 100, 2) end;
  recent := case when recent_count = 0 then null
    else round(recent_correct_count::numeric / recent_count * 100, 2) end;

  if attempt_count < 3 then
    mastery_score := null;
    mastery_status := 'insufficient-evidence';
  else
    mastery_raw :=
      (recent_correct_count::numeric / recent_count * 100) * 0.6
      + (correct_count::numeric / attempt_count * 100) * 0.4;
    mastery_score := round(mastery_raw, 2);
    mastery_status := case
      when mastery_raw < 50 then 'low'
      when mastery_raw < 80 then 'developing'
      else 'high'
    end;
  end if;

  insert into public.topic_mastery (
    user_id, topic_id, attempts, correct, recent_attempts, recent_correct,
    cumulative_accuracy, recent_accuracy, mastery, status, updated_at
  ) values (
    affected_user, affected_topic, attempt_count, correct_count,
    recent_count, recent_correct_count, cumulative, recent, mastery_score,
    mastery_status, now()
  )
  on conflict (user_id, topic_id) do update set
    attempts = excluded.attempts,
    correct = excluded.correct,
    recent_attempts = excluded.recent_attempts,
    recent_correct = excluded.recent_correct,
    cumulative_accuracy = excluded.cumulative_accuracy,
    recent_accuracy = excluded.recent_accuracy,
    mastery = excluded.mastery,
    status = excluded.status,
    updated_at = now();

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists learning_attempts_refresh_mastery on public.learning_attempts;
create trigger learning_attempts_refresh_mastery
  after insert or delete on public.learning_attempts
  for each row execute function public.refresh_topic_mastery();
