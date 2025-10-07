# Critical Bug Fix: Invoice Items Data Loss

## Problem

When updating an invoice, the code was doing:
1. **DELETE** all invoice_items
2. **INSERT** new invoice_items

If the INSERT failed (due to validation errors, network issues, etc.), the data was permanently lost because the DELETE already happened.

## Solution

Created a PostgreSQL function `update_invoice_items` that wraps both operations in a **transaction**:
- If INSERT succeeds → Both DELETE and INSERT are committed
- If INSERT fails → Both operations are rolled back (data is safe!)

## How to Apply

### Step 1: Run the SQL Function

Go to your Supabase SQL Editor and run:

```sql
CREATE OR REPLACE FUNCTION update_invoice_items(
  p_invoice_id INTEGER,
  p_items JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing invoice items
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;

  -- Insert new invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_id,
    item_name,
    quantity,
    rate,
    item_unit,
    position,
    original_rate,
    original_unit
  )
  SELECT
    p_invoice_id,
    (item->>'item_id')::INTEGER,
    item->>'item_name',
    (item->>'quantity')::INTEGER,
    (item->>'rate')::NUMERIC,
    item->>'item_unit',
    (item->>'position')::INTEGER,
    (item->>'original_rate')::NUMERIC,
    item->>'original_unit'
  FROM jsonb_array_elements(p_items) AS item;
END;
$$;

GRANT EXECUTE ON FUNCTION update_invoice_items(INTEGER, JSONB) TO authenticated;
```

### Step 2: Deploy the Code

The web app code has been updated to use this function:

**Before:**
```tsx
await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
const itemsToInsert = items.map(...)
await supabase.from('invoice_items').insert(itemsToInsert)
```

**After:**
```tsx
const itemsToInsert = items.map((item, idx) => ({ ...item, position: idx }))
await supabase.rpc('update_invoice_items', {
  p_invoice_id: parseInt(invoiceId, 10),
  p_items: itemsToInsert
})
```

## Benefits

✅ **Atomic operation** - Both delete and insert happen together or not at all
✅ **Data safety** - If insert fails, original data is preserved
✅ **Better error handling** - Clear error messages if something goes wrong
✅ **Same for mobile** - Flutter app can use the same RPC function

## Testing

After deploying:

1. Edit an existing invoice
2. Make some changes to items
3. Simulate an error (e.g., set quantity to a very large number that might fail validation)
4. Try to save
5. Verify that even if save fails, original items are still there

## Mobile Implementation

For the Flutter mobile app, use the same approach:

```dart
await supabase.rpc('update_invoice_items', params: {
  'p_invoice_id': invoiceId,
  'p_items': itemsJson,
});
```
