import Vue from "vue";
import Router from "vue-router";

import Call from "../components/Room";
import Home from "../components/Home"

Vue.use(Router);

const router = new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home
    },
    {
      path: "/call",
      name: "Call",
      component: Call,
    }
  ]
});

export default router;
