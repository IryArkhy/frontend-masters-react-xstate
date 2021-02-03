import * as React from "react";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProgressCircle } from "../ProgressCircle";
import { useMachine } from "@xstate/react";
import { timerMachine } from "./timerMachine";

// XState real time devTools
// import inspect, iframe: false to open a separate window
//import { inspect } from "@xstate/inspect";
// inspect({
//   iframe: false,
// });

// and settings object into useMachine
// https://statecharts.io/inspect
// const [state, send] = useMachine(timerMachine, { devTools: true });

export const Timer = () => {
  // https://statecharts.io/inspect
  const [state, send] = useMachine(timerMachine);

  const { duration, elapsed, interval } = {
    duration: 60,
    elapsed: 0,
    interval: 0.1,
  };
  const { value: status } = state;

  return (
    <div
      className="timer"
      data-state={status}
      style={{
        // @ts-ignore
        "--duration": duration,
        "--elapsed": elapsed,
        "--interval": interval,
      }}
    >
      <header>
        <h1>Exercise 01</h1>
      </header>
      <ProgressCircle />
      <div className="display">
        <div className="label">{status}</div>
        <div
          className="elapsed"
          onClick={() => {
            send("TOGGLE");
          }}
        >
          {Math.ceil(duration - elapsed)}
        </div>
        <div className="controls">
          {status === "paused" && (
            <button
              onClick={() => {
                send("RESET");
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="actions">
        {status === "running" && (
          <button
            onClick={() => {
              send("TOGGLE");
            }}
            title="Pause timer"
          >
            <FontAwesomeIcon icon={faPause} />
          </button>
        )}

        {status !== "running" && (
          <button
            onClick={() => {
              send("TOGGLE");
            }}
            title="Start timer"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>
        )}
      </div>
    </div>
  );
};
