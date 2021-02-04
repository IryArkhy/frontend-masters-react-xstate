import React, { useEffect } from "react";
import { createMachine, assign, spawn, sendParent, send } from "xstate";
import { useMachine, useService } from "@xstate/react";

// ---- 11 ---
// ACTORS
// Invoking actosr
// XState can handle effects in the form of actions, invoking actors and spawning actors.

const incrementCount = assign({
  count: (context) => context.count + 1,
});

const tooMuchGuard = (context, event) => context.count < 5;

// simulate request
const savAlarm = async () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(100);
      // rej();
    }, 2000);
  });
};
const alarmMachine1 = createMachine(
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
        // first example
        invoke: {
          // this function returns something that can be invoked: promise, an observable, callback or anothe machine
          src: (context, event) => savAlarm(),
          // --- use this if promise does not return data, or you don't need it
          // onDone: "active", // goes to this state onResolved
          // onError: "rejected", // goes to this state onReject

          //--- if you need data
          onDone: [
            // if promise successfull
            {
              target: "active",
              cond: (context, event) => {
                return event.data > 99;
              },
            },
            // if promise (request) fails
            {
              target: "rejected",
            },
          ],
          onError: "rejected",
        },
        on: {
          SUCCESS: "active",
          TOGGLE: "inactive",
        },
      },
      active: {
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
    },
    guards: {
      tooMuchGuard,
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
        // -- second example
        invoke: {
          // timeout actor
          id: "timeout",
          src: (context, event) => (sendBack, receive) => {
            // this callback function can also receive events
            receive((event) => {
              console.log(event);
            });

            const t = setTimeout(() => {
              // using this function you can send back to the parent any event
              sendBack({
                type: "SUCCESS",
              });
            }, 2000);
            // cleanup function just like in useEffect;
            return () => {
              clearTimeout(t);
            };
          },
          onError: "rejected",
        },
        on: {
          SUCCESS: "active",
          TOGGLE: {
            target: "inactive",
            //------ ?? desn't send events to the receive function above. Should console loge "BYE" event
            // target: "inactive", // any invocation is only active within the state that it's in. So you cannot switch to another state if you have send function inside the action to spawn the actor
            // this send()returns a special send object that can send an event directly to a spawned actor or invoced actor.
            // actions: send("BYE", { to: "timeout" }),
          },
        },
      },
      active: {
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

export const ScratchApp = () => {
  const [state, send] = useMachine(alarmMachine);

  const status = state.value;
  const { count } = state.context;

  // istead we created invoke key in the state machine inside the pending state
  // useEffect(() => {
  //   let timer;
  //   if (status === "pending") {
  //     timer = setTimeout(() => {
  //       send("SUCCESS");
  //     }, 2000);
  //   }
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [status, send]);

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
