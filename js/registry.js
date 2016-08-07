/**
 * A simple registry implementation based on ES6's `Map`.
 *
 * @class
 * @abstract
 */
Writer.Registry = class Registry {
  constructor() {
    /**
     * Internal store.
     *
     * @private
     * @type {Map}
     */
    this.map = new Map;
  }

  /**
   * Adds an object to the registry.
   *
   * @param {*} obj - The object to add
   */
  add(obj) {
    this.map.set(this.generateID(obj), obj);
  }

  /**
   * Instantiates a new object and returns its ID.
   *
   * @param {...*} args - Parameters used to create the new object.
   * @returns {*} The created object.
   */
  new(...args) {
    var id = this.generateID();
    var obj = this.generateObject(id, ...args);
    this.map.set(id, obj);
    return obj;
  }

  /**
   * Retrieves an object according to its ID. If the object isn't found, it
   * throws an exception.
   *
   * @returns {*}
   */
  get(id) {
    if(this.map.has(id))
      return this.map.get(id);
    else
      throw new Error(id+" not found!");
  }

  /**
   * Deletes a stored object according to its ID.
   * If the object isn't found, throws an exception.
   */
  delete(id) {
    if(this.map.has(id))
      return this.map.delete(id);
    else
      throw new Error(id+"not found!");
  }

  /**
   * Internal function that generates a new unique ID.
   *
   * @abstract
   * @param {*} [obj] - The object passed to `add()` if the method was used.
   * @returns {*} The generated ID.
   */
  generateID(obj) {
    throw new Error("Not implemented!");
  }

  /**
   * Internal function that returns a new object to be stored.
   * It is called by `Registry#new` with its arguments.
   *
   * @abstract
   * @param {*} id - A new unique ID for the object.
   * @param {...*} args - The arguments passed to `Registry#new`.
   * @returns {*} The generated object.
   */
  generateObject(id, ...args) {
    throw new Error("Not implemented!");
  }
};
