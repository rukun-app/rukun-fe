import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { profileContexts, clearAuthentication } from './authentication'
import { useContextStore } from '@/contexts/stores/context'
import { queryClient } from '@/app/providers/query'
import type { UserProfile } from '@/api/generated/models'

const user: UserProfile = {
  id: 1,
  name: 'Test',
  email: null,
  status: 'active',
  roles: ['bendahara-rt'],
  permissions: [],
}
beforeEach(() => {
  setActivePinia(createPinia())
  queryClient.clear()
})

describe('server-authorized presentation', () => {
  it('does not turn role names into permissions', () => {
    expect(profileContexts(user)).toEqual([])
  })
  it('only exposes global management for actual global permissions', () => {
    expect(profileContexts({ ...user, permissions: ['households.view'] })).toEqual([
      {
        id: 'global:management',
        type: 'management',
        label: 'Pengelolaan lingkungan',
        scope: { type: 'global', id: '' },
        capabilities: ['households.view'],
      },
    ])
  })
  it('rejects invented contexts and removes scoped caches on a valid switch', () => {
    const context = useContextStore()
    context.setContexts(
      profileContexts({ ...user, permissions: ['households.view', 'users.view'] }),
    )
    context.switchContext('global:management')
    queryClient.setQueryData(['community', 'global:management'], { private: true })
    expect(context.switchContext('fake')).toBe(false)
    expect(queryClient.getQueryData(['community', 'global:management'])).toBeDefined()
    expect(context.switchContext('global:system')).toBe(true)
    expect(queryClient.getQueryData(['community', 'global:management'])).toBeUndefined()
  })
  it('removes a revoked active context and cached data', () => {
    const context = useContextStore()
    context.setContexts(profileContexts({ ...user, permissions: ['households.view'] }))
    context.switchContext('global:management')
    queryClient.setQueryData(['private'], 'secret')
    context.setContexts([])
    expect(context.activeContext).toBeNull()
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })
  it('logout clears private data', () => {
    queryClient.setQueryData(['private'], 'secret')
    clearAuthentication()
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })
})
