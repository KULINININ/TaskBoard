<template>
  <div
    class="flex w-1/3 min-w-max flex-col items-stretch rounded-lg border border-gray-400 bg-white p-4 shadow-md">
    <div class="mb-2 border-b border-gray-300 pb-2 text-2xl">Switch Board</div>
    <div
      v-for="board in project.boards"
      :key="board.id"
      class="flex flex-row items-center justify-between p-4 transition-all duration-300 hover:border-purple-300 hover:bg-purple-200 active:bg-purple-300"
      @click="switchBoard(board)">
      <h1
        class="text-xl"
        :class="{
          'font-bold': board.id === projectsStore.board?.id,
        }">
        {{ board.name }}
      </h1>
      <span v-if="board.isDefault" class="italic text-gray-500">default</span>
    </div>
    <div
      v-if="
        authStore.hasPermission('projects:update') ||
        authStore.hasProjectPermission('boards:create')
      "
      class="flex flex-row items-center justify-center p-3 text-center text-gray-600 transition-all duration-300 hover:border-purple-300 hover:bg-purple-200 hover:text-gray-800 active:bg-purple-300"
      @click="$emit('create')">
      <h1>
        <i class="fas fa-lg fa-plus" />
      </h1>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Project } from '../types/project'
import { Board } from '../types/board'
import { mapStores } from 'pinia'
import { useProjectsStore } from '../stores/projects/projects'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  props: {
    project: {
      type: Object as PropType<Project>,
      required: true,
    },
  },
  emits: ['switched', 'create'],
  computed: { ...mapStores(useProjectsStore, useAuthStore) },
  methods: {
    switchBoard(board: Board) {
      this.$emit('switched', board.id)
    },
  },
})
</script>
