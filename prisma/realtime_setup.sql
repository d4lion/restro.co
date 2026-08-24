-- ==============================================================================
-- RESTRO - Supabase Realtime Broadcast Triggers & RLS Policy for KDS
-- ==============================================================================

-- 1. Función PL/pgSQL que arma el payload y lo transmite al canal del tenant
CREATE OR REPLACE FUNCTION broadcast_order_change() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id text;
  tenant_channel text;
BEGIN
  -- Determinar el tenant_id según la tabla que disparó el trigger
  IF TG_TABLE_NAME = 'Order' THEN
    v_tenant_id := COALESCE(NEW."tenantId", OLD."tenantId");
  ELSIF TG_TABLE_NAME = 'OrderItem' THEN
    SELECT "tenantId" INTO v_tenant_id 
    FROM "Order" 
    WHERE id = COALESCE(NEW."orderId", OLD."orderId");
  END IF;

  -- Emitir evento al canal realtime del tenant si existe tenant_id
  IF v_tenant_id IS NOT NULL THEN
    tenant_channel := 'orders:' || v_tenant_id;

    PERFORM realtime.broadcast_changes(
      tenant_channel,        -- topic (e.g. orders:tenant_123)
      TG_OP,                 -- event: INSERT / UPDATE / DELETE
      TG_OP,                 -- operation
      TG_TABLE_NAME,         -- table name: Order / OrderItem
      TG_TABLE_SCHEMA,       -- schema: public
      NEW,                   -- new record
      OLD                    -- old record
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Triggers sobre "Order" y "OrderItem"
DROP TRIGGER IF EXISTS trg_order_broadcast ON "Order";
CREATE TRIGGER trg_order_broadcast
AFTER INSERT OR UPDATE OF status, "isPriority" ON "Order"
FOR EACH ROW EXECUTE FUNCTION broadcast_order_change();

DROP TRIGGER IF EXISTS trg_order_item_broadcast ON "OrderItem";
CREATE TRIGGER trg_order_item_broadcast
AFTER INSERT OR UPDATE OF status ON "OrderItem"
FOR EACH ROW EXECUTE FUNCTION broadcast_order_change();

-- 3. Autorización de Canales Privados (RLS sobre realtime.messages)
-- Permite que los usuarios autenticados reciban mensajes únicamente del canal de su tenant
-- NOTA: realtime.messages ya tiene RLS habilitado por defecto en Supabase.
DROP POLICY IF EXISTS "tenant_can_read_own_orders_channel" ON realtime.messages;
CREATE POLICY "tenant_can_read_own_orders_channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'orders:' || (auth.jwt() ->> 'tenant_id')
);
