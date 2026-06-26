-- ================================================================
-- 修正: 結果ページ404の原因
--   PostgREST が public.user_answers をスキーマキャッシュに認識できず、
--   learning_history -> user_answers のJOIN(embed)が PGRST200 で失敗し、
--   結果ページが notFound() (404) になる問題を解消する。
--
-- 実行場所: Supabase Dashboard > SQL Editor で全文を実行
-- 冪等(何度実行してもOK)に作ってあります。
-- ================================================================

-- ── 1. テーブルが無ければ作成（通常は既存。保険） ──────────────────
CREATE TABLE IF NOT EXISTS public.user_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  history_id uuid NOT NULL,
  question_id uuid NOT NULL,
  selected_option_id uuid,
  text_answer text,
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 2. 外部キー制約を担保（PostgRESTのembedはFKで関係を解決する） ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_answers_history_id_fkey'
  ) THEN
    ALTER TABLE public.user_answers
      ADD CONSTRAINT user_answers_history_id_fkey
      FOREIGN KEY (history_id) REFERENCES public.learning_history(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_answers_question_id_fkey'
  ) THEN
    ALTER TABLE public.user_answers
      ADD CONSTRAINT user_answers_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_answers_selected_option_id_fkey'
  ) THEN
    ALTER TABLE public.user_answers
      ADD CONSTRAINT user_answers_selected_option_id_fkey
      FOREIGN KEY (selected_option_id) REFERENCES public.options(id);
  END IF;
END $$;

-- ── 3. 権限付与（PostgRESTがテーブルを公開するために必要） ──────────
GRANT ALL ON public.user_answers TO anon, authenticated, service_role;

-- ── 4. RLS とポリシーを担保 ──────────────────────────────────────
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own answers" ON public.user_answers;
CREATE POLICY "Users manage own answers" ON public.user_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.learning_history
            WHERE id = history_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins view all answers" ON public.user_answers;
CREATE POLICY "Admins view all answers" ON public.user_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. PostgREST のスキーマキャッシュを再読込（最重要） ──────────────
NOTIFY pgrst, 'reload schema';

-- ── 6. 確認 ──────────────────────────────────────────────────────
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.user_answers'::regclass;
