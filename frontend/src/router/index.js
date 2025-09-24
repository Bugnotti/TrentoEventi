import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import MissionVision from "../pages/MissionVision.vue";
import Profile from "../pages/Profile.vue";
import ReviewPage from "../pages/ReviewPage.vue";
import Notifications from "../pages/Notifications.vue";
import AdminDashboard from "../pages/AdminDashboard.vue";
import LeaderboardPage from "../pages/LeaderboardPage.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/mission-vision", component: MissionVision },
  { path: "/profile", component: Profile },
  { path: "/review", component: ReviewPage },
  { path: "/notifications", component: Notifications },
  { path: "/admin", component: AdminDashboard },
  { path: "/leaderboard", component: LeaderboardPage }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
