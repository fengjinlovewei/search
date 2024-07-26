<template>
  <div v-loading.fullscreen.lock="core.globalLoading" class="container">
    <slot></slot>
    <Email></Email>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store';
import Email from '@/components/Email.vue';

const store = useStore();

const { core } = store.state;
</script>

<style>
.container {
  padding: 0 50px 0;
}
</style>
