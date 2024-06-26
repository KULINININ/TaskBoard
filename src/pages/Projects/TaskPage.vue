<template>
  <div
    v-if="task"
    class="flex h-4/6 w-9/12 flex-row items-stretch justify-center divide-x divide-gray-300 rounded-md bg-gray-50 p-4">
    <div class="mr-4 flex flex-1 flex-col items-stretch">
      <div>
        <input
          v-model="form.title"
          type="text"
          :disabled="
            !authStore.hasPermission('projects:update') &&
            !authStore.hasProjectPermission('tasks:update')
          "
          class="w-full rounded border-none bg-gray-50 p-1 text-lg font-bold text-gray-800 outline-none hover:bg-gray-200 hover:ring-0 focus:ring-0 active:ring-0"
          @input="save" />
      </div>
      <div class="mt-2 h-full max-h-full flex-1 overflow-auto">
        <textarea
          v-show="false"
          ref="description"
          class="w-full rounded border-none bg-gray-50 p-1 text-gray-800 outline-none hover:bg-gray-200 hover:ring-0 focus:ring-0 active:ring-0" />
        <div
          v-if="!editing"
          class="prose prose-sm w-full p-1 text-gray-800"
          v-html="descriptionMarkdown"></div>

        <div class="mt-1 flex flex-row items-center">
          <AppButton
            v-if="editing"
            class="ml-auto w-20"
            size="sm"
            @click="toggleEditing">
            Save
          </AppButton>
        </div>
      </div>
    </div>

    <div class="flex w-4/12 max-w-xs flex-col items-stretch space-y-2 pl-4">
      <div class="mb-4">
        <div
          class="flex flex-row divide-x divide-gray-400 rounded border border-gray-400 text-gray-400">
          <button
            title="Edit title and description"
            class="flex-1 p-1 hover:bg-gray-100 hover:text-gray-500 active:text-gray-600"
            :disabled="
              !authStore.hasPermission('projects:update') &&
              !authStore.hasProjectPermission('tasks:update')
            "
            :class="{
              'bg-purple-300 text-gray-500 hover:bg-purple-400 hover:text-gray-600 active:text-gray-700':
                editing,
            }"
            @click="toggleEditing()">
            <i class="fas fa-pencil" />
          </button>
          <button
            title="Copy task link"
            class="flex-1 p-1 hover:bg-gray-100 hover:text-gray-500 active:text-gray-600"
            :class="{ 'text-green-500 hover:text-green-600': copied }"
            @click="copyLink()">
            <i v-if="!copied" class="fas fa-link" />
            <i v-else class="fas fa-check" />
          </button>
          <button
            title="Delete task"
            :disabled="
              !authStore.hasPermission('projects:update') &&
              !authStore.hasProjectPermission('tasks:delete')
            "
            class="flex-1 p-1 hover:bg-gray-100 hover:text-red-500 active:text-red-600"
            @click="tasksStore.deleteTask(task!.id)">
            <i class="fas fa-trash" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 text-sm text-gray-800">
        <span class="font-bold">Stage: </span>
        <span>{{ task.stage.name }}</span>

        <span class="font-bold">Created at: </span>
        <span>{{ new Date(task.createdAt).toDateString() }}</span>

        <span class="font-bold">Updated at: </span>
        <span>{{ new Date(task.updatedAt).toDateString() }}</span>
      </div>
      <div>
        <div class="mb-1 font-bold">Assignees</div>
        <div class="relative">
          <div v-if="task.assignees.length === 0">No assignees yet</div>
          <div
            v-if="showAssigneesSelector"
            class="fixed inset-0 cursor-pointer"
            @click="showAssigneesSelector = false"></div>
          <UsersSelector
            v-if="projectsStore.project && showAssigneesSelector"
            class="absolute z-50 w-full"
            :users="usersToAssign"
            @selected="(username: string) => addUserToTask(username)" />

          <div
            v-for="assignee in task.assignees"
            :key="assignee.username"
            class="group flex cursor-pointer flex-row items-center px-2 py-1 hover:bg-gray-200">
            <span>{{ assignee.fullName }}</span>
            &nbsp;
            <span class="text-gray-500">({{ assignee.username }})</span>
            <div
              v-if="
                authStore.hasPermission('projects:update') ||
                authStore.hasProjectPermission('assignees:update')
              "
              class="ml-auto h-6 w-6 rounded text-center text-transparent transition-colors group-hover:text-gray-400"
              @click="tasksStore.removeUserFromTask(assignee.username)">
              <i
                class="fas fa-trash fa-sm transition-colors hover:text-red-500" />
            </div>
          </div>
          <div
            v-if="
              authStore.hasPermission('projects:update') ||
              authStore.hasProjectPermission('assignees:update')
            "
            class="group flex cursor-pointer flex-row items-center justify-center px-2 py-1 hover:bg-gray-200"
            @click="showAssigneesSelector = true">
            <div
              class="h-6 w-6 rounded text-center text-gray-300 transition-colors hover:text-gray-500 group-hover:text-gray-400">
              <i class="fas fa-plus fa-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { marked } from 'marked'
import EasyMDE from 'easymde'
import 'easymde/dist/easymde.min.css'

import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { mapState } from 'pinia'
import { useTasksStore } from '../../stores/projects/tasks'
import UsersSelector from '../../components/UsersSelector.vue'
import { useProjectsStore } from '../../stores/projects/projects'
import { User } from '../../types/user'
import { modifiedFields } from '../../utils'
import { useAuthStore } from '../../stores/auth'

let easymde: EasyMDE

export default defineComponent({
  components: { UsersSelector },
  data() {
    return {
      editing: false,
      showAssigneesSelector: false,
      copied: false,
      form: {
        title: '',
        description: '',
      },
    }
  },
  computed: {
    ...mapStores(useTasksStore, useProjectsStore, useAuthStore),
    ...mapState(useTasksStore, ['task']),
    descriptionMarkdown(): string {
      if (!this.task) return ''

      return marked(this.task.description)
    },
    usersToAssign(): User[] {
      if (!this.projectsStore.project) return []

      return this.projectsStore.project.users
        .map((pu) => pu.user)
        .filter(
          (u) => !this.task?.assignees.find((tu) => tu.username === u.username)
        )
    },
  },
  mounted() {
    Object.assign(this.form, {
      title: this.task?.title,
      description: this.task?.description,
    })
  },
  methods: {
    save() {
      if (!this.task) return

      this.tasksStore.updateTask(
        modifiedFields(
          {
            title: this.task.title,
            description: this.task.description,
          },
          this.form
        )
      )
    },
    addUserToTask(username: string) {
      this.showAssigneesSelector = false
      this.tasksStore.addUserToTask(username)
    },
    toggleEditing() {
      if (this.editing) {
        this.disableEditing()
        this.save()
      } else {
        this.enableEditing()
      }
    },
    enableEditing() {
      if (!this.task) return
      if (this.editing) return

      this.editing = true

      easymde = new EasyMDE({
        element: this.$refs.description as HTMLElement,
        status: false,
        toolbarTips: false,
        forceSync: true,
        previewClass: 'h-full',
        hideIcons: ['guide', 'fullscreen', 'image', 'preview', 'side-by-side'],
        showIcons: ['code', 'table'],
      })
      easymde.codemirror.on('change', () => {
        if (!this.task) return

        this.form.description = easymde.value()
      })
      easymde.value(this.form.description)
    },
    disableEditing() {
      this.editing = false
      easymde.toTextArea()
      const el = this.$refs.description as HTMLElement
      el.hidden = true
    },
    copyLink() {
      navigator.clipboard.writeText(window.location.href)
      this.copied = true
      setTimeout(() => (this.copied = false), 2000)
    },
  },
})
</script>
