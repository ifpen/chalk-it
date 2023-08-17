// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.events                                                                    │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                           │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

/**
 * Listener callbacks for events
 *
 * @callback listenerCallback
 * @param {?any} message
 * @returns {void}
 */

/**
 * Allows to register listeners for 'events' and post notifications
 */
class EventCenter {
    constructor() {
        // Listener sets indexed by topic
        this._listeners = new Map();
    }

    /**
     * @description adds change a listener. Remember to unsubscribe when appropriate to avoir leaks (ex: when listener gets out of scope)
     * @param {string} event the event type to listen for
     * @param {listenerCallback} listener will be called whenever an event is sent.
     */
    addListener(event, listener) {
        let listeners = this._listeners.get(event);
        if (!listeners) {
            listeners = new Set();
            this._listeners.set(event, listeners);
        }
        listeners.add(listener);
    }

    /**
     * @description removes change a listener
     * @param {string} event the event type to stop listening listen for
     * @param {listenerCallback} listener 
     */
    removeListener(event, listener) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this._listeners.delete(event);
            }
        }
    }

    /**
     * @description posts an event
     * @param {string} event 
     * @param {?any} msg optional event data
     */
    sendEvent(event, msg = null) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(msg));
        }
    }
}

angular.module('modules.editor').service('EventCenterService', [EventCenter]);

const EVENTS_EDITOR_WIDGET_MOVED = 'WidgetMovedEvent';
const EVENTS_EDITOR_SELECTION_CHANGED = 'EditorSelectionChanged';
const EVENTS_EDITOR_ADD_REMOVE_WIDGET = 'EditorAddRemoveWidget';
const EVENTS_EDITOR_CONNECTIONS_CHANGED = 'EditorConnectionsChanged';