import { defineStore } from 'pinia'
import { api } from '../../api'
import { Project } from '../../types/project'
import { Board, BoardFull } from '../../types/board'
import { ProjectUserResponse } from '../../types/project-user'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    project: undefined as Project | undefined,
    board: undefined as BoardFull | undefined,
  }),
  actions: {
    async loadProjects() {
      try {
        const projects = (await api.get<Project[]>('/projects')).data

        this.projects = projects
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async loadProject(projectId: string) {
      try {
        const project = (await api.get<Project>(`/projects/${projectId}`)).data

        this.project = project
      } catch (e: unknown) {
        this.$toaster.error(e as string)
        this.$router.push({ name: 'projects' })
      }
    },
    async loadBoard(boardId?: string) {
      try {
        if (!boardId) {
          const defaultBoard = this.project?.boards.find((b) => b.isDefault)
          if (!defaultBoard) {
            return
          }

          boardId = defaultBoard.id.toString()
        } else {
          this.$router.push({
            query: { ...this.$router.currentRoute.value.query, board: boardId },
          })
        }

        const board = (
          await api.get<BoardFull>(
            `/projects/${this.project?.id}/boards/${boardId}`
          )
        ).data

        this.board = board
      } catch (e: unknown) {
        this.$toaster.error(e as string)
        this.$router.push({ name: 'projects' })
      }
    },
    async create(data: { name: string; description?: string }) {
      try {
        const project = (await api.post<Project>('/projects', data)).data

        this.$router.push({
          name: 'project',
          params: { projectId: project.id },
        })
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async delete(projectId: number) {
      try {
        await api.delete(`/projects/${projectId}`)

        this.$router.push({ name: 'projects' })
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async update(data: { name?: string; description?: string }) {
      try {
        if (!this.project) return

        const project = (
          await api.patch<Project>(`/projects/${this.project.id}`, data)
        ).data

        Object.assign(this.project, project)
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async createBoard(data: { name: string }) {
      try {
        if (!this.project) {
          return
        }

        const board = (
          await api.post<Board>(`/projects/${this.project.id}/boards`, data)
        ).data

        this.project.boards.push(board)

        await this.loadBoard(board.id.toString())
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async updateBoard(data: { name?: string }) {
      try {
        if (!this.project || !this.board) return

        const board = (
          await api.patch<Board>(
            `/projects/${this.project.id}/boards/${this.board.id}`,
            data
          )
        ).data

        const existingBoard = this.project.boards.find(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (b) => b.id === this.board!.id
        )
        if (existingBoard) {
          Object.assign(existingBoard, board)
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Object.assign(this.board!, board)
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async deleteBoard(boardId: number) {
      try {
        if (!this.project) {
          return
        }

        await api.delete(`/projects/${this.project.id}/boards/${boardId}`)

        this.project.boards = this.project.boards.filter(
          (b) => b.id !== boardId
        )

        await this.loadBoard()
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async createStage(data: { name: string }) {
      try {
        if (!this.project || !this.board) return

        const stage = (
          await api.post<Project>(
            `/projects/${this.project.id}/boards/${this.board.id}/stages`,
            data
          )
        ).data

        this.board.stages.push(stage)
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async deleteStage(stageId: number) {
      try {
        if (!this.project || !this.board) return

        await api.delete(
          `/projects/${this.project.id}/boards/${this.board.id}/stages/${stageId}`
        )

        const index = this.board.stages.findIndex((s) => s.id === stageId)
        this.board.stages.splice(index, 1)
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async moveStage(stageId: number, leadingStageId?: number) {
      try {
        if (!this.project || !this.board) return

        const stage = (
          await api.patch<Project>(
            `/projects/${this.project.id}/boards/${this.board.id}/stages/${stageId}/move`,
            {
              leadingStageId,
            }
          )
        ).data
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async addUserToProject(username: string) {
      if (!this.project) return

      try {
        const projectUser = (
          await api.put<ProjectUserResponse>(
            `/projects/${this.project.id}/users`,
            {
              username,
            }
          )
        ).data

        this.project.users.push(projectUser.users)
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async changeUserRole(username: string, roleName: string) {
      if (!this.project) return

      try {
        const projectUser = (
          await api.patch<ProjectUserResponse>(
            `/projects/${this.project.id}/users/${username}`,
            {
              roleName,
            }
          )
        ).data

        const user = this.project.users.find(
          (u) => u.user.username === username
        )
        if (!user) return

        user.role = projectUser.users.role
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
    async deleteUserFromProject(username: string) {
      if (!this.project) return

      try {
        const projectUser = (
          await api.delete<ProjectUserResponse>(
            `/projects/${this.project.id}/users/${username}`
          )
        ).data

        this.project.users = this.project.users.filter(
          (u) => u.user.username !== username
        )
      } catch (e: unknown) {
        this.$toaster.error(e as string)
      }
    },
  },
})
