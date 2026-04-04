import { supabase } from './supabase'

export async function logAction({ action, table_name, record_id, old_value, new_value, performed_by }) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      table_name,
      record_id: record_id?.toString(),
      old_value: old_value || null,
      new_value: new_value || null,
      performed_by,
      ip_address: 'client'
    })
  } catch (error) {
    console.error('Error logging action:', error)
  }
}
