import React, { useEffect } from "react";
import { createMachine, assign, spawn, sendParent } from "xstate";
import { useMachine, useService } from "@xstate/react";

// ---- 12 ---
// ACTORS
// Spawning actosr
// HOW exactly do you isolate behaviur in a component? With the help of an actor model.

// you can spawn promises, you can spawn observables, callbacks, and machines

// USE CASE: If you have nested actors and lower level actor wants to comunicate with an actor of a different level --> create an EVENTS BUS = an actor that acts as a ROUTER. It receives a message from an actor "Hey I want send `message` to actor#12". But in general an actor can comunicate with an actor that it has reference to.

const incrementCount = assign({
  count: (context) => context.count + 1,
});

const tooMuchGuard = (context, event) => context.count < 5;

// simulate request
const savAlarm = async () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(100);
    }, 2000);
  });
};

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
        invoke: {
          src: (context, event) => (sendBack, receive) => {
            const t = setTimeout(() => {
              sendBack({
                type: "SUCCESS",
              });
            }, 2000);
            return () => {
              clearTimeout(t);
            };
          },
          onError: "rejected",
        },
        on: {
          SUCCESS: "active",
          TOGGLE: "inactive",
        },
      },
      active: {
        entry: sendParent("ACTIVE"),
        on: {
          TOGGLE: {
            target: "inactive",
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

const Alarm = ({ alarmRef }) => {
  const [state, send] = useService(alarmRef);
  const status = state.value;
  const { count } = state.context;
  return (
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
  );
};

const alarmsMachine = createMachine({
  context: {
    alarms: [],
  },
  initial: "active",
  states: {
    active: {
      // spawning a new alarms actor
      on: {
        ADD_ALARM: {
          actions: assign({
            alarms: (context, event) => {
              // we are spawning an actor which is like special object with the behaviour of alarm machine
              const alarm = spawn(alarmMachine);

              return context.alarms.concat(alarm);
            },
          }),
        },
        ACTIVE: {
          actions: (context, event) => {
            console.log("Received: ", event);
          },
        },
      },
    },
  },
});

export const ScratchApp = () => {
  const [state, send] = useMachine(alarmsMachine);
  console.log(state);
  return (
    <div className="scratch">
      {/* When we click add alarms it creates a new actor and puts it inside the actors array inside the context. */}
      <button
        type="button"
        onClick={() => {
          send("ADD_ALARM");
        }}
      >
        Add alarm
      </button>
      {state.context.alarms.map((alarm, i) => (
        <Alarm key={i} alarmRef={alarm} />
      ))}
    </div>
  );
};
