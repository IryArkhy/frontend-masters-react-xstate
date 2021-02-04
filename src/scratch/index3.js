import React, { useEffect } from "react";
import { createMachine, assign, spawn, sendParent } from "xstate";
import { useMachine, useService } from "@xstate/react";

// ---- 11 ---
// STATE TYPES
// Shared States with useService

// how you can share machines between different components?
// in XState there is one way, interpretinf that machine and basically subscribing to that machin from everywhere. we can do that with useServiceHook and useContext. see the complete app main file and ForeignClock component to see more.

// Hierarchical States

const incrementCount = assign({
  count: (context) => context.count + 1,
});

const tooMuchGuard = (context, event) => context.count < 5;

const alarmMachine = createMachine(
  {
    initial: "inactive",
    context: {
      count: 0,
    },
    states: {
      inactive: {
        on: {
          TOGGLE: [
            {
              target: "pending",
              actions: "incrementCount",
              cond: "tooMuchGuard",
            },
            { target: "rejected" },
          ],
        },
      },
      pending: {
        entry: "telemetry",
        on: {
          SUCCESS: "active",
          TOGGLE: "inactive",
        },
      },
      // Hierarchical state
      active: {
        initial: "normal",
        states: {
          normal: {
            after: {
              1000: "looksGood",
            },
          },
          looksGood: {},
        },
        on: {
          TOGGLE: {
            target: "inactive",
            actions: "telemetry",
          },
        },
      },
      rejected: {},
    },
  },
  {
    actions: {
      incrementCount,
      telemetry: () => {},
    },
    guards: {
      tooMuchGuard,
    },
  }
);

export const ScratchApp = () => {
  const [state, send] = useMachine(alarmMachine);

  const status = state.value;
  const { count } = state.context;

  useEffect(() => {
    let timer;
    if (status === "pending") {
      timer = setTimeout(() => {
        send("SUCCESS");
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status, send]);

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          ({count}) ({state.toStrings().join(" ")})
        </div>
        <div
          className="alarmToggle"
          data-active={status === "active" || undefined}
          style={{
            opacity: status === "pending" ? 0.5 : 1,
          }}
          onClick={() => {
            send("TOGGLE");
          }}
          role="presentation"
        ></div>
      </div>
    </div>
  );
};
