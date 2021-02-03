import React, { useEffect, useState, useReducer } from "react";
import { createMachine, assign, spawn, sendParent } from "xstate";
import { useMachine, useService } from "@xstate/react";

// ---- 10 ---
// TRANSITIONS
// Eventless transitions - transitions that occurs immidiately and do not require event

const incrementCount = assign({
  count: (context) => context.count + 1,
});

const tooMuchGuard = (context, event) => context.count < 5;

const isMorning = (ctx) => new Date().getHours() < 12;
const greetMachine = createMachine(
  {
    //dynamic initial state
    initial: "unknown",
    states: {
      unknown: {
        // Transient transitions because it's going somwhere else
        always: [
          // Be CARFUL you can get caught in an infinite loop -> stack overflow
          // if you have a condition but you forget to provide the alternative target in the array
          {
            cond: "isMorning",
            target: "morning",
          },
          {
            target: "day",
          },
        ],
      },
      morning: {},
      day: {},
    },
  },
  {
    guards: {
      isMorning,
    },
  }
);
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
      active: {
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
  const [greetState] = useMachine(greetMachine);
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
      <h2> Good {greetState.value === "morning" ? "morning!!" : "day!"}</h2>
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
