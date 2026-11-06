-- GigTrack — colunas de cifra nas músicas (já aplicado)
alter table public.songs add column if not exists chord_sheet      text;
alter table public.songs add column if not exists chord_key        text;
alter table public.songs add column if not exists chord_source_url text;
alter table public.songs add column if not exists chord_updated_at timestamptz;
comment on column public.songs.chord_sheet is 'Cifra em texto puro; linhas de acordes acima da letra, ou [Acorde] inline';
