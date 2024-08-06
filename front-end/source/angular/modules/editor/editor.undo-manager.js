// ┌────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.undo-manager                                                                │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                                        │ \\
// | Licensed under the Apache License, Version 2.0                                     │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                             │ \\
// └────────────────────────────────────────────────────────────────────────────────────┘ \\

/**
 * Interface of actions for the UndoManager
 */
export class UndoableAction {
  constructor() {}

  /**
   * @returns the action's description, mostly for display in the history
   */
  label() {
    return 'Undefined Action';
  }

  /**
   * @description performs the action.
   */
  run() {}

  /**
   * @returns {boolean} true if redo() can be called
   */
  canRedo() {
    return false;
  }

  /**
   * @description redo the action. Should only ever be called if canRedo() returned true and after an undo(). Defaults to calling "run()".
   */
  redo() {
    this.run();
  }

  /**
   * @returns {boolean} true if undo() can be called
   */
  canUndo() {
    return false;
  }

  /**
   * @description undo the action. Should only ever be called if canUndo() returned true.
   */
  undo() {}

  /**
   * @description offers actions the possibility to be merged with the previous one (for example to merge successive keyboard moves). Called AFTER run(), when inserting into the history.
   * @param {UndoableAction} previous previous action that might be merged with this one
   * @returns {?UndoableAction} new action replacing woth this action and other, or null if no merge should happen
   */
  merge(previous) {
    return null;
  }

  /**
   * @description Called when the action is discarded, in case some cleaup is necessary (unsubscribing listeners, etc.)
   */
  dispose() {}
}

export class UndoManager {
  static UNDO_STACK_CHANGE_EVENT = 'UndoStackChange';

  /**
   * @param {EventCenter=} eventCenter if provided, will send UNDO_STACK_CHANGE_EVENT event when the history changes
   */
  constructor(eventCenter) {
    this._undoStack = [];
    this._redoStack = [];

    if (eventCenter) {
      this._eventCenter = eventCenter;
    }
  }

  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._onChange();
  }

  // Notifications
  _onChange() {
    if (this._eventCenter) {
      this._eventCenter.sendEvent(UndoManager.UNDO_STACK_CHANGE_EVENT);
    }
  }

  /**
   * @returns {Array.<string>} the labels of the actions in the undo stack. Last performed action is on top (at the end).
   */
  undoStackLabels() {
    return this._undoStack.map((action) => action.label());
  }

  /**
   * @returns {Array.<string>} the labels of the actions in the redo stack. Last undone action is on top (at the end).
   */
  redoStackLabels() {
    return this._redoStack.map((action) => action.label());
  }

  /**
   * @description executes an action and adds it to the undo stack if undoable.
   * @param {UndoableAction} action
   */
  execute(action) {
    this._cleanRedo();
    action.run();

    if (action.canUndo()) {
      if (this._undoStack.length) {
        const last = this._undoStack.length - 1;
        const merged = action.merge(this._undoStack[last]);
        if (merged) {
          this._undoStack[last] = merged;
        } else {
          this._undoStack.push(action);
        }
      } else {
        this._undoStack.push(action);
      }
    } else {
      this._cleanUndo();
    }
    this._onChange();
  }

  /**
   * @returns true if an action can be redone
   */
  canRedo() {
    const count = this._redoStack.length;
    return count > 0 && this._redoStack[count - 1].canRedo();
  }

  /**
   * @description Redo an action if possible
   */
  redo() {
    if (this._redoStack.length) {
      const action = this._redoStack.pop();
      if (action.canRedo()) {
        action.redo();
        this._undoStack.push(action);
      } else {
        action.dispose();
        this._cleanRedo();
      }
      this._onChange();
    }
  }

  /**
   * @returns true if an action can be undone
   */
  canUndo() {
    const count = this._undoStack.length;
    return count > 0 && this._undoStack[count - 1].canUndo();
  }

  /**
   * @description Undo an action if possible
   */
  undo() {
    if (this._undoStack.length) {
      const action = this._undoStack.pop();
      if (action.canUndo()) {
        action.undo();
        this._redoStack.push(action);
      } else {
        action.dispose();
        this._cleanUndo();
      }
      this._onChange();
    }
  }

  _cleanUndo() {
    if (this._undoStack.length > 0) {
      this._undoStack.forEach((a) => a.dispose());
      this._undoStack = [];
    }
  }

  _cleanRedo() {
    if (this._redoStack.length > 0) {
      this._redoStack.forEach((a) => a.dispose());
      this._redoStack = [];
    }
  }
}

angular.module('modules.editor').service('UndoManagerService', ['EventCenterService', UndoManager]);
