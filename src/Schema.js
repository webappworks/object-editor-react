import * as validation from './validation';
import _ from 'lodash';
import { expect } from 'chai';

export const SchemaTypes = {
    any: getOptionalSchemaTypeFactory(
        validation.isSomething,
        'any'
    ),

    string: getOptionalSchemaTypeFactory(
        validation.getPrimitiveValidator('string'),
        'string'
    ),
    boolean: getOptionalSchemaTypeFactory(
        validation.getPrimitiveValidator('boolean'),
        'boolean'
    ),
    function: getOptionalSchemaTypeFactory(
        validation.getPrimitiveValidator('function'),
        'function'
    ),
    number: getOptionalSchemaTypeFactory(
        validation.getPrimitiveValidator('number'),
        'number'
    ),
    date: getOptionalSchemaTypeFactory(
        validation.isValidDate,
        'date'
    ),

    array: getOptionalSchemaTypeFactory(Array.isArray, 'array'),
    object: getOptionalSchemaTypeFactory(validation.isObject, 'object'),

    /*
     * Usage:
     *      const schema = {
     *          foo: SchemaTypes.arrayOf({
     *              bar: SchemaTypes.string,
     *          })(),
     *
     *          bar: SchemaTypes
     *              .arrayOf(SchemaTypes.string())().isRequired,
     *      };
     */
    arrayOf: arrayElementType => {
        return (options = {}) => {
            return getOptionalSchemaTypeFactory(
                validation.isArrayOfType(arrayElementType),
                'arrayOf'
            )({
                // Pass user-specified options through
                ...options,

                // Make the element type available
                _elementType: arrayElementType,
            });
        };
    },

    shape: shape => {
        if (!validation.isValidShape(shape)) {
            throw new Error(`Expected a valid shape, but got ${JSON.stringify(shape)}`);
        }

        return (options = {}) => {
            return getOptionalSchemaTypeFactory(
                object => validation.objectMatchesSchema(shape, object),
                'shape'
            )({
                ...options,

                _shape: shape
            })
        }
    },

    // todo: oneOf, oneOfType, shape, null
};

/**
 * Returns a SchemaType factory based on the validation function "validator"
 * and the type name "typeName".
 *
 * The SchemaType returned by the factory allows the value passed to it to
 * be undefined, or requires it to pass the validator -- an "optional"
 * SchemaType.
 *
 * The SchemaTypes returned by the factory will have an "isRequired" property,
 * which is a version of the SchemaType that requires the value passed to it
 * to be defined _and_ to pass the validator.
 *
 * @param {function} validator
 * @param {string} typeName
 */
export function getOptionalSchemaTypeFactory (validator, typeName) {
    return (opts = {}) => {
        const optionalSchemaType = SchemaType(
            validation.getOptionalValidator(validator),
            typeName,
            opts
        );

        // The required variant
        optionalSchemaType.isRequired = SchemaType(
            validator,
            typeName,
            opts
        );

        return optionalSchemaType;
    }
}

export function WithImmutableVariables (Class, ...variableNames) {
    const variables = _.zipObject(
        variableNames,
        variableNames.map(_.constant(null))
    );

    console.log('vars', variables);

    const update = _.reduce(
        variableNames,
        (updatedClass, variableName) => {
            updatedClass.__proto__ = {
                ...updatedClass.__proto__,

                // Getter always returns the stored value
                get [variableName] () {
                    return variables[variableName];
                },

                // Setter allows the variable to be set exactly once --
                // afterward, it throws.
                set [variableName] (value) {
                    expect(variables[variableName]).to.be.null;
                    variables[variableName] = value;
                    return value;
                }
            };

            return updatedClass;
        },
        Class
    );

    console.log('update', update.__proto__);

    return update;
}

export const SchemaTypeClass = WithImmutableVariables(class SchemaTypeClass {
    // Always true
    isSchemaType = true;

    constructor (validator, typeName, options = {}) {
        expect(validator).to.be.a('function');
        expect(typeName).to.be.a('string');

        this.type = typeName;
        this.type = 'another value';
    }

    /**
     * This property is set for all valid SchemaTypes, so checking for
     * its existence is a reliable way to determine if a function
     * is a SchemaType.
     *
     * @type {boolean}
     * @public
     */
    // get isSchemaType () {
    //     return true;
    // }
}, 'isSchemaType', 'type', 'elementType');

new SchemaType(() => null, 'afkj', {});

// Create a SchemaType (really just a function with `_type` and
// `_isSchemaType` properties)
export function SchemaType (validate, type, opts = {}) {
    const func = validate;
    func.__proto__ = {
        // TODO: explicitly check the __proto__ (or use getter!) for these props, so their names
        // TODO: are free for use by higher level object schemas.
        // e.g. the following breaks things
        /*
         * const schema = {
         *      foo: SchemaTypes.string(),
         *      _type: SchemaTypes.string(),
         *      _isSchemaType: SchemaTypes.string(),
         * };
         */
        _isSchemaType: true,
        _type: type,

        ...opts
    };

    return func;
};
