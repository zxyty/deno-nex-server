const privateMap = new WeakMap();

let callbacks: {
    [eventname: string]: {
        callback?: Function
    }[] | null;
} = {};

function internal(obj: object) {
    if (!privateMap.has(obj)) {
        privateMap.set(obj, {});
    }

    return privateMap.get(obj);
}

export default class EventEmitter {
    constructor() {
        const self = internal(this);
        self.events = new Set();

        return this;
    }

    has(eventName: string) {
        return internal(this).events.has(eventName);
    }

    addCallback(eventName: string, callback: Function) {
        this.getCallbacks(eventName)!.push({
            callback,
        });
        return this;
    }

    getCallbacks(eventName: string) {
        return callbacks[eventName];
    }

    getCallbackIndex(eventName: string, callback: Function) {
        return this.has(eventName)
            ? this.getCallbacks(eventName)!.findIndex(
                element => element.callback === callback,
            )
            : -1;
    }

    on(eventName: string, callback: Function) {
        const self = internal(this);

        if (typeof callback !== 'function') {
            throw new TypeError(`${callback} is not a function`);
        }

        if (!this.has(eventName)) {
            self.events.add(eventName);
            if (!callbacks[eventName]) {
                callbacks[eventName] = [];
            }
        }

        this.addCallback(eventName, callback);

        return this;
    }

    once(eventName: string, callback: Function) {
        const onceCallback = (...args: any) => {
            this.off(eventName, onceCallback);
            return callback(...args);
        };

        return this.on(eventName, onceCallback);
    }

    off(eventName: string, callback: Function) {
        const self = internal(this);
        let callbackInd;

        if (this.has(eventName)) {
            if (!callback) {
                self.events.delete(eventName);
                callbacks[eventName] = null;
            } else {
                callbackInd = this.getCallbackIndex(eventName, callback);

                if (callbackInd !== -1) {
                    this.getCallbacks(eventName)!.splice(callbackInd, 1);
                    this.off(eventName, callback);
                }
            }
        }

        return this;
    }

    emit(eventName: string, ...args: any) {
        const custom = callbacks[eventName]!;
        let i = custom ? custom.length : 0;
        let current;

        while (i--) {
            current = custom[i];

            if (arguments.length > 1) {
                current.callback!(...args);
            } else {
                current.callback!();
            }
        }

        return this;
    }

    clear() {
        internal(this).events.clear();
        callbacks = {};

        return this;
    }
}
