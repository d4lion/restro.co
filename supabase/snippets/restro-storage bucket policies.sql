-- 1. Eliminar políticas anteriores con conflictos
DROP POLICY IF EXISTS "Tenant Insert Isolation" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Update Isolation" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Delete Isolation" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Restro Assets" ON storage.objects;

-- 2. Lectura pública global (Carta Digital QR)
CREATE POLICY "Public Read Access for Restro Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'restro-storage' );

-- 3. Inserción permitida para usuarios autenticados
CREATE POLICY "Authenticated Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restro-storage'
  AND auth.role() = 'authenticated'
);

-- 4. Actualización/Reemplazo permitido para usuarios autenticados
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'restro-storage'
  AND auth.role() = 'authenticated'
);

-- 5. Eliminación permitida para usuarios autenticados
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'restro-storage'
  AND auth.role() = 'authenticated'
);
