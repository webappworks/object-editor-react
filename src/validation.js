import _ from 'lodash';

// Validates an ObjectEditor schema object
// A valid schema object is an object with SchemaTypes as
// its leaves.
export function isValidSchema (schema, location = '') {
    // Base case: leaf is a SchemaType
    if (schema._isSchemaType) {
        return null;
    }

    // Schema is an object -- test each key at this level of the schema
    if (typeof schema === 'object' && Object.keys(schema).length > 0) {
        Object
            .keys(schema)
            .forEach(
                key => isValidSchema(schema[key], location + '.' + key)
            );

        // No errors thrown, so schema is valid.
        return null;
    }

    // Schema is bad
    throw new Error(invalidSchemaMessage(schema, location));
}

// Returns true if test is a valid match for schema.
// Schema must be a valid schema (has SchemaTypes in leaves)
// This function just does some validation and then passes control
// to the recursive function, objectMatchesSchemaInner.
export function objectMatchesSchema (schema, testObject) {
    // Throw if the schema is bad.
    try {
        isValidSchema(schema);
    } catch (err) {
        throw new Error('Expected "schema" to be a valid schema');
    }

    // Pass control to rec function
    return objectMatchesSchemaInner(schema, testObject);
}

// Recursively make sure that `test` is a valid instance of `schema`
function objectMatchesSchemaInner (schema, testObject) {
    // Base case: SchemaType leaf
    // Just evaluate directly
    if (schema._isSchemaType) {
        return schema(testObject);
    }

    // We already know schema is a valid schema, so we can go ahead
    // and evaluate it as an object.

    // Object case
    // True if each key of test matches each key of schema
    return Object.keys(schema)
        .map(
            key => objectMatchesSchemaInner(schema[key], testObject && testObject[key])
        )
        .reduce(
            (memo, match) => memo && match,
            true
        );
}

// Returns true if `test` is a __valid__ JS Date object
export function isValidDate (test) {
    if (toString(test) !== '[object Date]') {
        return false;
    }

    return !isNaN(test.getTime());
}

// Returns a function that takes a test variable and returns true
// if it's type is equal to `type`
export function getPrimitiveValidator (type) {
    return test => typeof test === type;
}

// Returns true if `test` is anything but undefined.
export function isSomething (test) {
    return typeof test !== 'undefined';
}

// Returns true if `test` is a vanilla object
export function isObject (test) {
    return toString(test) === '[object Object]';
}

// Returns a function that returns true if
// `testArray` is an array whose objects match the schema `type`
export function isArrayOfType (type) {
    return function (testArray) {
        return (
            Array.isArray(testArray) &&
            _.every(
                testArray,
                el => objectMatchesSchema(type, el)
            )
        );
    };
}

/**
 * An object is a valid shape if both hold:
 *      * it's a valid Schema
 *      * it's a plain object
 *
 * @param {Object} schema - the schema to test
 * @return {null} if the schema is valid
 * @throws {Error} if the schema is invalid
 */
export function isValidShape (schema) {
    if (!isObject(schema)) {
        throw new Error(`Expected schema to be an object, but got ${typeof schema}`);
    }

    return isValidSchema(schema);
}

// Given a validator, returns another validator that takes an "isRequired" parameter
// and validates the variables under the following constraints:
//      1) it's valid if the variable is not required, and the variable doesn't exist
//      2) it's valid if the actual validator function returns true
//
// Usage:
//
//      const maybeValidateString = getOptionalValidator(str => typeof str === 'string');
//
//      const validateString = maybeValidateString(true);
//      console.log(validateString('foo')); // true
//      console.log(validateString(10)); // false
//      console.log(validateString(undefined)); // false
//
//      const validateStringOrNothing = maybeValidateString(false);
//      console.log(validateStringOrNothing('foo')); // true
//      console.log(validateStringOrNothing(10)); // false
//      console.log(validateStringOrNothing(undefined)); // true
export const getOptionalValidator = actuallyValidate => {
    // Allows the testObject to be undefined.
    return testObject => {
        return (
            typeof testObject === 'undefined' ||
            actuallyValidate(testObject)
        );
    };
};

// Helper for calling Object.toString() on an arbitrary object.
export function toString (object) {
    return Object.prototype.toString.call(object);
}

// Returns a message for an error caused by an invalid Schema type.
export function invalidSchemaMessage (badLeaf, location) {
    return `(At ${location}): Expected a SchemaType, but got ${badLeaf}:${typeof badLeaf}`;
}

