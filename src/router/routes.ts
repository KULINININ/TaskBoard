import { NavigationGuardWithThis, type RouteRecordRaw } from 'vue-router'

import SignIn from '../pages/Auth/SignIn.vue'
import AuthPage from '../pages/Auth/AuthPage.vue'
import SettingsPage from '../pages/Admin/SettingsPage.vue'
import ChangeOtp from '../pages/Auth/ChangeOtp.vue'
import InstanceTab from '../pages/Admin/InstanceTab.vue'
import UsersTab from '../pages/Admin/UsersTab.vue'
import UserTab from '../pages/Admin/UserTab.vue'
import SetupPage from '../pages/SetupPage.vue'
import RolesTab from '../pages/Admin/RolesTab.vue'
import RoleTab from '../pages/Admin/RoleTab.vue'
import ProjectsPage from '../pages/Projects/ProjectsPage.vue'
import ProjectPage from '../pages/Projects/ProjectPage.vue'
import ProjectSettingsPage from '../pages/Projects/ProjectSettingsPage.vue'
import NewProjectPage from '../pages/Projects/NewProjectPage.vue'
import BoardPage from '../pages/Projects/BoardPage.vue'
import ProjectSettingsProjectPage from '../pages/Projects/ProjectSettingsProjectPage.vue'
import ProjectSettingsBoardPage from '../pages/Projects/ProjectSettingsBoardPage.vue'
import ProjectSettingsUsersPage from '../pages/Projects/ProjectSettingsUsersPage.vue'

const preserveBoardQuery: NavigationGuardWithThis<undefined> = (
  to,
  from,
  next
) => {
  console.log('!!!!')
  if (from.query.board && !to.query.board) {
    return next({
      ...to,
      query: {
        ...to.query,
        board: from.query.board,
      },
    })
  }

  next()
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', redirect: '/projects' },
  { path: '/setup', name: 'setup', component: SetupPage },
  {
    path: '/auth',
    name: 'auth',
    redirect: '/auth/sign-in',
    component: AuthPage,
    children: [
      { path: 'sign-in', component: SignIn },
      { path: 'change-otp', name: 'change-otp', component: ChangeOtp }, //TODO: guard only after login attempt
    ],
  },
  {
    // TODO: guard
    path: '/settings',
    name: 'settings',
    redirect: '/settings/instance',
    component: SettingsPage,
    children: [
      { path: 'instance', component: InstanceTab },
      { path: 'users', name: 'users', component: UsersTab },
      { path: 'users/:username', name: 'user', component: UserTab },
      { path: 'roles', name: 'roles', component: RolesTab },
      { path: 'roles/:roleName', name: 'role', component: RoleTab },
    ],
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsPage,
  },
  {
    path: '/projects/new',
    name: 'new-project',
    component: NewProjectPage,
  },
  {
    path: '/projects/:projectId',
    name: 'project',
    component: ProjectPage,
    children: [
      {
        beforeEnter: preserveBoardQuery,
        path: '',
        name: 'project-board',
        component: BoardPage,
      },
      {
        path: 'settings',
        name: 'project-settings',
        component: ProjectSettingsPage,
        beforeEnter: preserveBoardQuery,
        redirect: { name: 'project-settings-project' },
        children: [
          {
            path: 'project',
            name: 'project-settings-project',
            beforeEnter: preserveBoardQuery,
            component: ProjectSettingsProjectPage,
          },
          {
            path: 'board',
            name: 'project-settings-board',
            beforeEnter: preserveBoardQuery,
            component: ProjectSettingsBoardPage,
          },
          {
            path: 'users',
            name: 'project-settings-users',
            beforeEnter: preserveBoardQuery,
            component: ProjectSettingsUsersPage,
          },
        ],
      },
    ],
  },
]
