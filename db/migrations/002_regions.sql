-- Регионы на поддоменах: город переехал из раздела «Контакты и реквизиты» в раздел «Регионы» (основной домен).
-- В новой базе раздела «site» ещё нет — «Регионы» заполнит npm run db:seed.
INSERT INTO content (key, data)
SELECT 'regions',
       jsonb_build_object(
         'main', jsonb_build_object('name', '[Город]', 'nameGen', '[города]', 'namePrep', coalesce(data->>'city', '[вашем городе]')),
         'items', '[]'::jsonb
       )
FROM content
WHERE key = 'site'
ON CONFLICT (key) DO NOTHING;
