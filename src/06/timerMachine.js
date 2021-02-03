import { createMachine, assign } from "xstate";

const timerExpired = (ctx) => ctx.elapsed >= ctx.duration;

export const timerMachine = createMachine(
  {
    initial: "idle",
    context: {
      duration: 5,
      elapsed: 0,
      interval: 0.1,
    },
    states: {
      idle: {
        id: "idle",
        entry: assign({
          duration: 5,
          elapsed: 0,
        }),
        on: {
          TOGGLE: "running",
        },
      },
      running: {
        // Add the `normal` and `overtime` nested states here.
        // Don't forget to add the initial state (`normal`)!
        initial: "normal",
        states: {
          normal: {
            always: {
              cond: "timerExpired",
              target: "overtime",
            },
            on: {
              // forbiden transaction
              RESET: undefined,
            },
          },
          overtime: {
            // defining final state
            // after: {
            //   2000: "timeover",
            // },
            on: {
              RESET: "#idle",
              TOGGLE: undefined,
            },
          },
          //defining final state
          // timeover: {
          //   type: "final",
          // },
        },
        // defining final transition
        // onDone: "idle",
        on: {
          TICK: {
            actions: assign({
              elapsed: (ctx) => ctx.elapsed + ctx.interval,
            }),
          },
          TOGGLE: "paused",
          ADD_MINUTE: {
            actions: assign({
              duration: (ctx) => ctx.duration + 60,
            }),
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
    on: {
      RESET: {
        target: ".idle",
      },
    },
  },
  {
    guards: {
      timerExpired,
    },
  }
);
