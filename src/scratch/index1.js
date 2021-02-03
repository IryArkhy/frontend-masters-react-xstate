import React, { useEffect, useState, useReducer } from "react";
import { createMachine, assign, spawn, sendParent } from "xstate";
import { useMachine, useService } from "@xstate/react";

// Live Coding with Lecturer
// This is localhost:3000 url
// the name of the exported component should be "ScratchApp" in order to see it on the page

// ---- 1 ----
// The problem: this component has only 2 states: ative(true) | inactive(false). You cannnot add more states to this component because you are limeted with boolean values.

export const ScratchApp1 = () => {
  const [isActive, setIsActive] = useState(true);
  // state of toggle:
  // true
  // false

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          className="alarmToggle"
          data-active={isActive || undefined}
          onClick={(e) => setIsActive(!isActive)}
        ></div>
      </div>
    </div>
  );
};

// ---- 2 ----

// The problem: if another developer comes and looks at your code, he has to look in multiple places to figure out what's going on: into useState, useEffect and onClick handler inside the component. Moreover, onClick handler can do 2 things depending on the condition.

// When designing the state of the component, always ask yourself: "what the possible states this app or component can be in?"

export const ScratchApp2 = () => {
  const [status, setStatus] = useState("inactive");
  // state of toggle:
  // 'inactive'
  // 'panding' ?? (saving) - another needed status that cannot be represented as boolean value
  // 'active'

  useEffect(() => {
    // immitates the time for sending the request
    // after the request is successfully resolved
    // change state to 'active'
    let timer;
    if (status === "pending") {
      timer = setTimeout(() => {
        setStatus("active");
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          className="alarmToggle"
          data-active={status === "active" || undefined}
          style={{
            opacity: status === "pending" ? 0.5 : 1,
          }}
          // onClick={(e) => setStatus("pending")} //BEFORE
          onClick={() => {
            if (status === "active") setStatus("inactive");
            setStatus("pending");
          }} // AFTER
          role="presentation"
        ></div>
      </div>
    </div>
  );
};

// ---- 3 ----
// HOW TO REFACTOR THIS IN A STATE MOACHINE?
// 1) write a state machine diagram, e. g. with Excalidraw
// 2) try to implement the logic with states and transitions using useReducer
// 3)  Your component becomes more complex if you have more decentralized logic (logic in different places). But once you do reducer, you are centralizing logic in one place - in the reducer. This is just one place you are going to go to find out how the component work.

const initialState1 = "pending";

const alarmReducer1 = (state, event) => {
  switch (state) {
    case "inactive":
      if (event.type === "TOGGLE") {
        return "pending";
      }
      return state;
    case "pending":
      if (event.type === "SUCCESS") {
        return "active";
      }
      if (event.type === "TOGGLE") {
        return "inactive";
      }
      return state;
    case "active":
      if (event.type === "TOGGLE") {
        return "inactive";
      }
      return state;
    default:
      return state;
  }
};

export const ScratchApp3 = () => {
  const [status, dispatch] = useReducer(alarmReducer1, initialState1);

  useEffect(() => {
    let timer;
    if (status === "pending") {
      timer = setTimeout(() => {
        dispatch({ type: "SUCCESS" });
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          className="alarmToggle"
          data-active={status === "active" || undefined}
          style={{
            opacity: status === "pending" ? 0.5 : 1,
          }}
          onClick={() => {
            dispatch({ type: "TOGGLE" });
          }}
          role="presentation"
        ></div>
      </div>
    </div>
  );
};

// ---- 4 ----
// Using a machine object

// https://xstate.js.org/viz/
const alarmMachine1 = {
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: "pending",
      },
    },
    pending: {
      on: {
        SUCCESS: "active",
        TOGGLE: "inactive",
      },
    },
    active: {
      on: {
        TOGGLE: "inactive",
      },
    },
  },
};

const alarmReducer2 = (state, event) => {
  // AFTER: what the next event should be given the current state and an event

  //  alarmMachine.states[state] - current state
  // .on[event.type] - returns a state ON current event
  const nextState = alarmMachine1.states[state].on[event.type] || state;
  return nextState;
};

export const ScratchApp4 = () => {
  const [status, dispatch] = useReducer(alarmReducer2, alarmMachine1.initial);

  useEffect(() => {
    let timer;
    if (status === "pending") {
      timer = setTimeout(() => {
        dispatch({ type: "SUCCESS" });
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          className="alarmToggle"
          data-active={status === "active" || undefined}
          style={{
            opacity: status === "pending" ? 0.5 : 1,
          }}
          onClick={() => {
            dispatch({ type: "TOGGLE" });
          }}
          role="presentation"
        ></div>
      </div>
    </div>
  );
};

// ---- 5 ----
// Using XState in a pure way (xstate instead of @xstate/react)

const alarmMachine2 = createMachine({
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: "pending",
      },
    },
    pending: {
      on: {
        SUCCESS: "active",
        TOGGLE: "inactive",
      },
    },
    active: {
      on: {
        TOGGLE: "inactive",
      },
    },
  },
});

// 1 arg = current state
// 2 arg = event object
// console.log(alarmMachine.transition("pending", { type: "SUCCESS" }));

const alarmReducer3 = (state, event) => {
  const nextState = alarmMachine2.transition(state, event.type);
  return nextState;
};

export const ScratchApp5 = () => {
  const [state, dispatch] = useReducer(
    alarmReducer3,
    alarmMachine2.initialState
  );

  const status = state.value; // pending, active, inactive

  useEffect(() => {
    let timer;
    if (status === "pending") {
      timer = setTimeout(() => {
        dispatch({ type: "SUCCESS" });
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  return (
    <div className="scratch">
      <div className="alarm">
        <div className="alarmTime">
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          className="alarmToggle"
          data-active={status === "active" || undefined}
          style={{
            opacity: status === "pending" ? 0.5 : 1,
          }}
          onClick={() => {
            dispatch({ type: "TOGGLE" });
          }}
          role="presentation"
        ></div>
      </div>
    </div>
  );
};

// ---- 6 ---
// Using xstate for react

const alarmMachine3 = createMachine({
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: "pending",
      },
    },
    pending: {
      on: {
        SUCCESS: "active",
        TOGGLE: "inactive",
      },
    },
    active: {
      on: {
        TOGGLE: "inactive",
      },
    },
  },
});

export const ScratchApp6 = () => {
  const [state, send] = useMachine(alarmMachine3);

  const status = state.value;

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
// ---- 7 ---
// Extended State
// finite state/ infinite state

// Use case: we want to keep track of how many times we clicked toggle

// in order to change context, use assign() function. It is a pure function and all it does is returns an object.

// console.log(assign({ count: 100 }));

const alarmMachine4 = createMachine({
  initial: "inactive",
  context: {
    count: 0,
  },
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: "pending", // the state to transition to
          actions: assign({
            count: (context) => context.count + 1,
          }),
        },
      },
    },
    pending: {
      on: {
        SUCCESS: "active",
        TOGGLE: "inactive",
      },
    },
    active: {
      on: {
        TOGGLE: "inactive",
      },
    },
  },
});

export const ScratchApp7 = () => {
  const [state, send] = useMachine(alarmMachine4);

  const status = state.value;
  // extended state value
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
          ({count})
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

// ---- 8 ---
// Parameterizing Actions
// Parameterization is a refactoring feature of XState that makes it easier to visualize how different parts of your machine are working and just showing what they are supposed to be doing.

// WHY?
// because you will have the ability to change what the side effects do with useMachine hook. In your machine you can specify default action, in the component itself you can change it by passing a second argument into useMachine

const incrementCount1 = assign({
  count: (context) => context.count + 1,
});

const alarmMachine5 = createMachine(
  {
    initial: "inactive",
    context: {
      count: 0,
    },
    states: {
      inactive: {
        on: {
          TOGGLE: {
            target: "pending",
            actions: "incrementCount1",
          },
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
    },
  },
  // second parameter
  {
    actions: {
      incrementCount1,
      // placeholder function that should be implemented by the consumer of the machine
      telemetry: () => {},
    },
  }
);

// `service` in the useMachine is a machine that's running, interpreted macine. If you want to do somethin onentering of EACH state, use service.

export const ScratchApp8 = () => {
  const [state, send, service] = useMachine(alarmMachine5, {
    actions: {
      incrementCount1: assign({
        count: (context, event) => context.count + 100,
      }),
      // this could be ANY function that does ANYTHING, not just changing the machine's context, e.g.:
      // incrementCount1: (context, event) => {
      //   alert("The count changed!");
      // },
      telemetry: (context, event) => {
        console.log("Logging telemetry", event);
      },
    },
  });

  // useEffect is usefull if you want to do something every single time the state changes
  useEffect(() => {
    const subs = service.subscribe((state) => {
      // ... do whatever
    });
    return () => subs.unsubscribe();
  }, [state, service]);

  const status = state.value;
  // extended state value
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
          ({count})
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

// ---- 9 ---
// TRANSITIONS
// Guarded transitions
// TIP: try to parameterize your state machine in order to make it completely serealizable. It's great for visualizing tools, and for XState Python, and to be able to convert to and from STXML.

// IF machine gets too big, you want to apply the separation of concerns. You can have a machine that invokes another machine.

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
              // it will be renamed to "guard" in the future
              cond: "tooMuchGuard", // in guards object below
            },
            // if condition is true and transition to pending state is imposible, it will transition to 'rejected'
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

// -------------------------

// These commented lines were in the beggining on the master branch
// const incrementCount = assign({
//   count: (context, event) => {
//     return context.count + 1;
//   },
// });

// const notTooMuch = (context, event) => {
//   return context.count < 5;
// };

// const greetMachine = createMachine({
//   initial: "unknown",
//   states: {
//     unknown: {
//       always: [
//         {
//           cond: () => {
//             return new Date().getHours() < 12;
//           },
//           target: "morning",
//         },
//         { target: "day" },
//       ],
//     },
//     morning: {},
//     day: {},
//   },
// });

// const saveAlarm = async () => {
//   return new Promise((res, rej) => {
//     setTimeout(() => {
//       res(100);
//     }, 2000);
//   });
// };

// const alarmMachine = createMachine(
//   {
//     initial: "inactive",
//     context: {
//       count: 0,
//     },
//     states: {
//       inactive: {
//         on: {
//           TOGGLE: [
//             {
//               target: "pending",
//               actions: "increment",
//               cond: "notTooMuch",
//             },
//             {
//               target: "rejected",
//             },
//           ],
//         },
//       },
//       pending: {
//         invoke: {
//           id: "timeout",
//           src: (context, event) => (sendBack, receive) => {
//             receive((event) => {
//               console.log(event);
//             });

//             const timeout = setTimeout(() => {
//               sendBack({
//                 type: "SUCCESS",
//               });
//             }, 2000);

//             return () => {
//               clearTimeout(timeout);
//             };
//           },
//           onError: "rejected",
//         },
//         on: {
//           SUCCESS: "active",
//           TOGGLE: {
//             target: "inactive",
//           },
//         },
//       },
//       active: {
//         entry: sendParent("ACTIVE"),
//       },
//       rejected: {},
//     },
//   },
//   {
//     actions: {
//       increment: incrementCount,
//     },
//     guards: {
//       notTooMuch,
//     },
//   }
// );

// const Alarm = ({ alarmRef }) => {
//   const [state, send] = useService(alarmRef);

//   const status = state.value;
//   const { count } = state.context;

//   return (
//     <div className="alarm">
//       <div className="alarmTime">
//         {new Date().toLocaleTimeString("en-US", {
//           hour: "2-digit",
//           minute: "2-digit",
//         })}{" "}
//         ({count}) ({state.toStrings().join(" ")})
//       </div>
//       <div
//         className="alarmToggle"
//         data-active={status === "active" || undefined}
//         style={{
//           opacity: status === "pending" ? 0.5 : 1,
//         }}
//         onClick={() => {
//           send("TOGGLE");
//         }}
//       ></div>
//     </div>
//   );
// };

// const alarmsMachine = createMachine({
//   context: {
//     alarms: [],
//   },
//   initial: "active",
//   states: {
//     active: {
//       on: {
//         ADD_ALARM: {
//           actions: assign({
//             alarms: (context, event) => {
//               const alarm = spawn(alarmMachine);

//               return context.alarms.concat(alarm);
//             },
//           }),
//         },
//         ACTIVE: {
//           actions: (context, event) => {
//             console.log("Received", event);
//           },
//         },
//       },
//     },
//   },
// });

// export const ScratchApp = () => {
//   const [state, send] = useMachine(alarmsMachine);

//   return (
//     <div className="scratch">
//       <button onClick={() => send("ADD_ALARM")}>Add Alarm</button>
//       {state.context.alarms.map((alarm, i) => {
//         return <Alarm alarmRef={alarm} key={i} />;
//       })}
//     </div>
//   );
// };
