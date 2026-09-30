import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import { useUnsavedChanges } from './useUnsavedChanges'
const guards = vi.hoisted(() => ({
  leave: undefined as undefined | (() => boolean),
  update: undefined as undefined | (() => boolean),
}))
const route = reactive({ fullPath: '/form/one' })
vi.mock('vue-router', () => ({
  useRoute: () => route,
  onBeforeRouteLeave: (guard: () => boolean) => {
    guards.leave = guard
  },
  onBeforeRouteUpdate: (guard: () => boolean) => {
    guards.update = guard
  },
}))
function render() {
  return mount(defineComponent({ setup: useUnsavedChanges, template: '<div />' }))
}
beforeEach(() => {
  route.fullPath = '/form/one'
})
describe('unsaved form guard', () => {
  it('protects both route leave and same-component record changes', async () => {
    const wrapper = render()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    expect(guards.leave!()).toBe(true)
    wrapper.vm.dirty = true
    expect(guards.leave!()).toBe(false)
    expect(guards.update!()).toBe(false)
    confirm.mockReturnValue(true)
    expect(guards.update!()).toBe(true)
    route.fullPath = '/form/two'
    await nextTick()
    expect(wrapper.vm.dirty).toBe(false)
    wrapper.unmount()
    confirm.mockRestore()
  })
  it('protects reload/close and removes the listener when unmounted', () => {
    const wrapper = render()
    let event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    wrapper.vm.dirty = true
    event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
    event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
