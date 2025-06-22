/**
 * @typedef {new (...args: any[]) => any} Class
 */

/**
 * @type {Map<Class, Class>}
 */
const classMap = new Map();

/**
 * @param {Class} interfaceClass
 * @param {Class} implementClass
 * @returns {boolean}
 */
const checkImplementation = (interfaceClass, implementClass) => {
    const interfaceInstance = new interfaceClass;
    const implementInstance = new implementClass;

    const unimplement = {
        prop: [],
        method: []
    };

    for (const k of Object.getOwnPropertyNames(interfaceInstance)) {
        if (!(k in implementInstance)) {
            unimplement.prop.push(k);
        }
    }

    let prototype = Object.getPrototypeOf(interfaceInstance);
    while (prototype.constructor !== Object) {
        for (const k of Object.getOwnPropertyNames(prototype)) {
            if (!(k in implementInstance) && !(unimplement.prop.includes(k))) {
                unimplement.method.push(k);
            }
        }
        prototype = Object.getPrototypeOf(prototype);
    }

    return [unimplement].some(({ prop, method }) => {
        if (prop.length !== 0) {
            console.error(`${implementClass.name} must implement property: ${prop}`);
        }

        if (method.length !== 0) {
            console.error(`${implementClass.name} must implement method: ${method}`);
        }

        return (prop.length === 0 && method.length === 0);
    });
}

/**
 * @param {Class} interfaceClass
 * @param {Class} implementClass
 */
const setImplementation = (interfaceClass, implementClass) => {
    if (checkImplementation(interfaceClass, implementClass)) {
        classMap.set(interfaceClass, implementClass);
    }
}

/**
 * @param {Class} interfaceClass
 * @returns {boolean}
 */
const clearImplementation = (interfaceClass) => {
    return classMap.delete(interfaceClass);
}

/**
 * @template {Class} T
 * @param {T} interfaceClass
 * @param {ConstructorParameters<T>} args
 * @returns {InstanceType<T>}
 */
const createInstance = (interfaceClass, ...args) => {
    const implementClass = classMap.get(interfaceClass);
    return implementClass ? new implementClass(...args) : new interfaceClass(...args);
}

export { setImplementation, clearImplementation, createInstance };
