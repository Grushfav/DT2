const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function all(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
  
  if (error) {
    console.error(`Error fetching from ${table}:`, error)
    throw error
  }
  
  return data || []
}

async function get(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error(`Error fetching ${table} with id ${id}:`, error)
    throw error
  }
  
  return data
}

async function insert(table, row) {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single()
  
  if (error) {
    console.error(`Error inserting into ${table}:`, error)
    throw error
  }
  
  return data
}

async function update(table, id, patch) {
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating ${table} with id ${id}:`, error)
    throw error
  }
  
  return data
}

async function remove(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error(`Error deleting from ${table} with id ${id}:`, error)
    throw error
  }
  
  return { ok: true }
}

module.exports = { all, get, insert, update, remove }
