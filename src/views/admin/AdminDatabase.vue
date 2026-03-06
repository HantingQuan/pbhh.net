<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const tables = ref<string[]>([])
const selectedTable = ref('')
const tableRows = ref<Record<string, unknown>[]>([])
const tableColumns = computed(() => tableRows.value[0] ? Object.keys(tableRows.value[0]) : [])
const loadingTable = ref(false)

const authHeaders = computed(() => {
  const token = localStorage.getItem('token') ?? ''
  return { Authorization: `Bearer ${token}` }
})

async function loadTables() {
  const res = await fetch('/api/admin/tables', { headers: authHeaders.value })
  if (res.ok) {
    tables.value = await res.json()
    if (tables.value.length)
      selectedTable.value = tables.value[0]!
  }
}

async function loadTable() {
  if (!selectedTable.value)
    return
  loadingTable.value = true
  const res = await fetch(`/api/admin/db/${selectedTable.value}`, { headers: authHeaders.value })
  if (res.ok) {
    const data = await res.json()
    tableRows.value = data.rows
  }
  loadingTable.value = false
}

watch(selectedTable, loadTable)

const TABLE_PK: Record<string, string[]> = {
  posts: ['id'],
  notifications: ['id'],
  user_capabilities: ['username', 'capability'],
  post_likes: ['postId', 'username'],
  user_bindings: ['username', 'platform'],
}

const canDelete = computed(() => selectedTable.value in TABLE_PK)

async function deleteRow(row: Record<string, unknown>) {
  const pkCols = TABLE_PK[selectedTable.value]
  if (!pkCols)
    return
  const pk: Record<string, unknown> = {}
  for (const col of pkCols) pk[col] = row[col]
  const res = await fetch(`/api/admin/db/${selectedTable.value}`, {
    method: 'DELETE',
    headers: { ...authHeaders.value, 'Content-Type': 'application/json' },
    body: JSON.stringify(pk),
  })
  if (res.ok)
    tableRows.value = tableRows.value.filter(r => !pkCols.every(col => r[col] === row[col]))
}

const grantUser = ref('')
const grantCap = ref('')

async function submitGrant() {
  if (!grantUser.value || !grantCap.value)
    return
  const res = await fetch('/api/admin/db/user_capabilities', {
    method: 'POST',
    headers: { ...authHeaders.value, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: grantUser.value, capability: grantCap.value }),
  })
  if (res.ok) {
    await loadTable()
    grantUser.value = ''
    grantCap.value = ''
  }
}

function cellValue(v: unknown) {
  if (v === null || v === undefined)
    return '—'
  if (v instanceof Date)
    return v.toLocaleString('zh-CN')
  if (typeof v === 'object')
    return JSON.stringify(v)
  return String(v)
}

onMounted(loadTables)
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex items-center gap-2 px-4 py-2 border-b shrink-0 flex-wrap">
      <select
        v-model="selectedTable"
        class="text-sm border rounded px-2 py-1 bg-background"
      >
        <option v-for="t in tables" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
      <Button size="sm" variant="outline" :disabled="loadingTable" @click="loadTable">
        <Spinner v-if="loadingTable" data-icon="inline-start" />
        刷新
      </Button>
      <span class="text-xs text-muted-foreground">{{ tableRows.length }} 条</span>
      <template v-if="selectedTable === 'user_capabilities'">
        <div class="h-4 border-l" />
        <input v-model="grantUser" placeholder="用户名" class="text-xs border rounded px-2 py-1 bg-background w-24">
        <input v-model="grantCap" placeholder="权限" class="text-xs border rounded px-2 py-1 bg-background w-32">
        <Button size="sm" variant="outline" :disabled="!grantUser || !grantCap" @click="submitGrant">
          授权
        </Button>
      </template>
    </div>
    <div class="flex-1 overflow-auto">
      <table class="text-xs w-full border-collapse">
        <thead class="sticky top-0 bg-background shadow-[0_1px_0_0_var(--border)]">
          <tr>
            <th
              v-for="col in tableColumns"
              :key="col"
              class="text-left px-3 py-2 font-medium text-muted-foreground border-r whitespace-nowrap"
            >
              {{ col }}
            </th>
            <th v-if="canDelete" class="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in tableRows"
            :key="i"
            class="border-b hover:bg-muted/50"
          >
            <td
              v-for="col in tableColumns"
              :key="col"
              class="px-3 py-1.5 border-r max-w-60 truncate"
              :title="String(row[col] ?? '')"
            >
              {{ cellValue(row[col]) }}
            </td>
            <td v-if="canDelete" class="px-3 py-1.5">
              <button class="text-xs text-red-500 hover:text-red-700" @click="deleteRow(row)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="tableRows.length === 0 && !loadingTable" class="text-muted-foreground py-8 text-center text-sm">
        暂无数据
      </div>
    </div>
  </div>
</template>
