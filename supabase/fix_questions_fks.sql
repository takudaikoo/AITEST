-- ================================================================
-- 修正: questions テーブルを参照する外部キーの欠落を補う
--
--   questions の再作成/再インポート時に、questions を参照していた
--   FK制約(options, program_questions, weaknesses)と、questions 自身の
--   review_program_id -> programs が失われていた。
--   このため PostgREST が以下のJOIN(embed)を解決できず、
--   結果ページの回答詳細(questions->options)などが表示できない。
--
--   既存データに孤児行があっても失敗しないよう NOT VALID で追加する。
--   (PostgREST は NOT VALID 制約も関係として認識し、今後のINSERT/UPDATEには
--    制約が有効に働く。既存行の検証だけをスキップする。)
--
-- 実行場所: Supabase Dashboard > SQL Editor で全文を実行（冪等）
-- ================================================================

DO $$
BEGIN
  -- options.question_id -> questions.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'options_question_id_fkey') THEN
    ALTER TABLE public.options
      ADD CONSTRAINT options_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE NOT VALID;
  END IF;

  -- program_questions.question_id -> questions.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'program_questions_question_id_fkey') THEN
    ALTER TABLE public.program_questions
      ADD CONSTRAINT program_questions_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE NOT VALID;
  END IF;

  -- weaknesses.question_id -> questions.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weaknesses_question_id_fkey') THEN
    ALTER TABLE public.weaknesses
      ADD CONSTRAINT weaknesses_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE NOT VALID;
  END IF;

  -- questions.review_program_id -> programs.id
  -- ※ review_program_id カラムが存在する場合のみ追加（再作成時に欠落しているDBがある）
  IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions'
          AND column_name = 'review_program_id'
     )
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_review_program_id_fkey') THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_review_program_id_fkey
      FOREIGN KEY (review_program_id) REFERENCES public.programs(id) NOT VALID;
  END IF;
END $$;

-- PostgREST のスキーマキャッシュを再読込
NOTIFY pgrst, 'reload schema';

-- 確認: questions に関係する全FK
SELECT conname, conrelid::regclass AS table_name, contype
FROM pg_constraint
WHERE confrelid = 'public.questions'::regclass
   OR conrelid  = 'public.questions'::regclass
ORDER BY conname;
