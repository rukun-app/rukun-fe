<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

const props = withDefaults(
  defineProps<{
    message: string
    header?: string
    acceptLabel?: string
    rejectLabel?: string
    /** 'danger' renders accept button in red */
    severity?: 'default' | 'danger'
  }>(),
  {
    header: 'Konfirmasi',
    acceptLabel: 'Ya',
    rejectLabel: 'Batal',
    severity: 'default',
  },
)

const emit = defineEmits<{ confirm: []; reject: [] }>()
const confirm = useConfirm()

function trigger(event: Event) {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: props.message,
    header: props.header,
    acceptLabel: props.acceptLabel,
    rejectLabel: props.rejectLabel,
    acceptClass: props.severity === 'danger' ? 'p-button-danger' : undefined,
    accept: () => emit('confirm'),
    reject: () => emit('reject'),
  })
}
</script>

<template>
  <!--
    ConfirmAction wraps PrimeVue ConfirmDialog trigger.
    Requires <ConfirmDialog /> mounted in the shell (done via ConfirmationService).
    Usage: <ConfirmAction message="Hapus data?" @confirm="doDelete">
             <button>Hapus</button>
           </ConfirmAction>
  -->
  <span @click="trigger">
    <slot />
  </span>
</template>
