import { createMachine, assign } from "xstate";

const ticker = (context) => (callback) => {
  // This is the callback service creator.
  // Add the implementation details here.

  // we can only have this interval run when it's in this state(the running state, the state it's invoked in)
  const i = setInterval(() => {
    callback({
      type: "TICK",
    });
  }, context.interval * 1000);
  // cleanup function just like in useEffect;
  // once you exit the current state - the cleanup function will be invoked
  return () => {
    console.log("clean up");
    setInterval(i);
  };
};

const timerExpired = (ctx) => ctx.elapsed >= ctx.duration;

// https://xstate.js.org/viz/?gist=78fef4bd3ae520709ceaee62c0dd59cd
export const timerMachine = createMachine({
  id: "timer",
  initial: "idle",
  context: {
    duration: 60,
    elapsed: 0,
    interval: 0.1,
  },
  states: {
    idle: {
      entry: assign({
        duration: 60,
        elapsed: 0,
      }),
      on: {
        TOGGLE: "running",
        RESET: undefined,
      },
    },
    running: {
      // Invoke the callback service here.
      invoke: {
        src: ticker,
      },
      initial: "normal",
      states: {
        normal: {
          always: {
            target: "overtime",
            cond: timerExpired,
          },
          on: {
            RESET: undefined,
          },
        },
        overtime: {
          on: {
            TOGGLE: undefined,
          },
        },
      },
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
      on: { TOGGLE: "running" },
    },
  },
  on: {
    RESET: {
      target: ".idle",
    },
  },
});
