import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, type PropType } from 'vue'
import PrimeVue from 'primevue/config'
import Column from 'primevue/column'
import AppDataTable from './AppDataTable.vue'
import { setLocale } from '@/i18n'
const rows = [
  { public_id: 'one', name: 'Zahra', phone: '0812', reference: 'internal-only' },
  { public_id: 'two', name: 'Budi', phone: '0822', reference: 'secret' },
]
function render(overrides = {}) {
  const Harness = defineComponent({
    components: { AppDataTable, Column },
    props: {
      rows: { type: Array as PropType<typeof rows>, default: () => rows },
      pageKey: String,
      busy: Boolean,
      pending: Boolean,
      next: String,
      error: String,
    },
    template: `<AppDataTable :rows="rows" title="Warga" :search-fields="['name', 'phone']" empty-title="Belum ada warga" v-bind="$props"><Column field="name" header="Nama" sortable /><Column field="phone" header="Telepon" /></AppDataTable>`,
  })
  return mount(Harness, { props: overrides, global: { plugins: [PrimeVue] } })
}
beforeEach(() => setLocale('id'))
describe('shared DataTable', () => {
  it('renders slotted columns, searches visible fields, and clears no-results state', async () => {
    const wrapper = render()
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    await wrapper.get('input').setValue('ZAHRA')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.get('tbody').text()).toContain('Zahra')
    await wrapper.get('input').setValue('internal-only')
    expect(wrapper.text()).toContain('Tidak ada hasil pencarian')
    await wrapper.get('[aria-label="Hapus pencarian"]').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('internal-only')
  })
  it('sorts the current page and resets search and sort on a new cursor', async () => {
    const wrapper = render({ pageKey: 'first' })
    await wrapper.get('th').trigger('click')
    expect(wrapper.get('tbody tr').text()).toContain('Budi')
    await wrapper.get('input').setValue('Zahra')
    await wrapper.setProps({ pageKey: 'next' })
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('tbody tr').text()).toContain('Zahra')
  })
  it('emits the opaque cursor and disables navigation while busy', async () => {
    const wrapper = render({ next: 'opaque-token' })
    const next = wrapper.findAll('button').find((button) => button.text().includes('Berikutnya'))!
    await next.trigger('click')
    expect(wrapper.findComponent(AppDataTable).emitted('page')).toEqual([['opaque-token']])
    await wrapper.setProps({ busy: true })
    expect(next.attributes('disabled')).toBeDefined()
  })
  it('hides stale rows on error and emits retry', async () => {
    const wrapper = render({ error: 'Request failed', next: 'next' })
    expect(wrapper.find('table').exists()).toBe(false)
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(wrapper.findComponent(AppDataTable).emitted('retry')).toHaveLength(1)
  })
  it('distinguishes loading, empty data, and English copy', async () => {
    const wrapper = render({ pending: true })
    expect(wrapper.find('table').exists()).toBe(false)
    await wrapper.setProps({ pending: false, rows: [] })
    expect(wrapper.text()).toContain('Belum ada warga')
    setLocale('en')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('input[aria-label="Search this page"]').exists()).toBe(true)
  })
})
