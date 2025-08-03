// src/data/AetherStore.js

/**
 * @class AetherStore
 * The core of the reactive data layer. It manages a single piece of state
 * and provides methods to interact with it. It's designed to be the
 * local-first source of truth for the application.
 */
export class AetherStore {
  /**
   * @constructor
   * @param {any} initialState - The initial value of the store.
   */
  constructor(initialState) {
    this._state = initialState;
    this._subscribers = new Set();
  }

  /**
   * Subscribes a callback function to state changes.
   * @param {function} callback - The function to call when the state changes.
   * @returns {function} An unsubscribe function.
   */
  subscribe(callback) {
    this._subscribers.add(callback);
    callback(this._state); // Immediately call with current state

    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Updates the store's state and notifies all subscribers.
   * @param {any} newState - The new state.
   */
  set(newState) {
    if (newState !== this._state) {
      this._state = newState;
      this._notify();
    }
  }

  /**
   * Updates the store's state using an updater function.
   * @param {function} updater - A function that receives the current state
   * and returns the new state.
   */
  update(updater) {
    this.set(updater(this._state));
  }

  /**
   * Notifies all subscribers of a state change.
   * @private
   */
  _notify() {
    for (const callback of this._subscribers) {
      callback(this._state);
    }
  }

  /**
   * Returns the current state.
   * @returns {any} The current state.
   */
  get() {
    return this._state;
  }
}
