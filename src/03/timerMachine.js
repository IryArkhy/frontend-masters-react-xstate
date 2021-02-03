import { createMachine, assign } from "xstate";

// Parameterize the assign actions here:
const tick = assign({
  elapsed: (ctx) => ctx.elapsed + ctx.interval,
});

const addMinute = assign({
  duration: (ctx) => ctx.duration + 60,
});
const reset = assign({
  duration: 60,
  elapsed: 0,
});

export const timerMachine = createMachine(
  {
    initial: "idle",
    context: {
      duration: 60,
      elapsed: 0,
      interval: 0.1,
    },
    states: {
      idle: {
        // Parameterize this action:
        // this could be a private action, no one can change it from the component.
        entry: reset,
        on: {
          TOGGLE: "running",
        },
      },
      running: {
        on: {
          // On the TICK event, the context.elapsed should be incremented by context.interval
          TICK: {
            actions: "tick",
          },
          TOGGLE: "paused",
          ADD_MINUTE: {
            // Parameterize this action:
            actions: "addMinute",
          },
        },
      },
      paused: {
        on: {
          TOGGLE: "running",
          RESET: "idle",
        },
      },
    },
  },
  {
    // this actions could be re-implemented from the consumer component
    actions: {
      tick,
      addMinute,
      // reset,
    },
  }
);
