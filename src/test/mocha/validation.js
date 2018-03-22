import * as validation from '../../validation';
import * as Schema from '../../Schema';

import _ from 'lodash';
import { expect } from 'chai';

// Some primitives to test against
const PRIMITIVES = [
    1,
    Infinity,
    null,
    { foo: 'bar' },
    true,
    'hello, world',
    () => true,
];

// A valid schema used across many of the tests
const VALID_SCHEMA = {
    foo: Schema.SchemaTypes.string().isRequired,
    bar: Schema.SchemaTypes.number(),
    baz: {
        biz: Schema.SchemaTypes.number(),
        boz: Schema.SchemaTypes.number(),

        booz: {
            barz: {
                nested: Schema.SchemaTypes.number(),
            }
        }
    },
};

describe('isValidSchema()', () => {
    it('should return null for a valid schema', done => {
        const validSchemas = [
            ...VALID_SCHEMA,
            Schema.SchemaTypes.any()
        ];

        validSchemas.forEach(
            schema => {
                expect(validation.isValidSchema(schema)).to.be.null;
            }
        );

        done();
    });

    it('should throw for an invalid schema', done => {
        const invalid = [
            {
                foo: Schema.SchemaTypes.string({ required: true }),
                bar: 'this one breaks the schema',
                baz: {
                    biz: Schema.SchemaTypes.number(),
                    boz: Schema.SchemaTypes.number(),

                    booz: {
                        barz: {
                            nested: Schema.SchemaTypes.number(),
                        }
                    }
                },
            },

            'just a string',

            {},

            undefined,
            null
        ];

        invalid.forEach(
            invalidSchema => {
                expect(() => validation.isValidSchema(invalidSchema)).to.throw(Error)
            }
        );

        done();
    })
});


describe('objectMatchesSchema()', () => {
    it('should return true when the test matches', done => {
        // Valid instances of the "validSchema" defined above.
        const validSchemaInstances = [
            {
                foo: 'string',
                bar: 1,
                baz: {
                    biz: 1,
                    boz: 1,

                    booz: {
                        barz: {
                            nested: 1,
                        }
                    }
                },
            },
            { foo: 'string' }
        ];

        validSchemaInstances.forEach(
            validInstance => {
                expect(validation.objectMatchesSchema(VALID_SCHEMA, validInstance)).to.be.true;
            }
        );

        done();
    });

    it('should return false when the test fails', done => {
        const invalidInstances = [
            {
                foo: 'string',
                bar: 'string',
                baz: {
                    biz: NaN,
                    boz: 1,

                    booz: {
                        barz: {
                            nested: 1,
                        }
                    }
                },
            },
            {
                foo: 1,
            },
            {
                foo: null,
            },
            {},
            1,
            undefined,
        ];

        invalidInstances.forEach(
            instance => {
                expect(validation.objectMatchesSchema(VALID_SCHEMA, instance)).to.be.false;
            }
        );

        done();
    });
});


describe('isValidDate()', () => {
    it('should return true for a valid date', done => {
        expect(validation.isValidDate(new Date())).to.be.true;
        done();
    });

    it('should return false an invalid date', done => {
        expect(validation.isValidDate(new Date('bad date right here'))).to.be.false;
        done();
    });

    it('should return false a non-date', done => {
        expect(validation.isValidDate('not a date at all')).to.be.false;
        done();
    });
});

describe('getPrimitiveValidator', () => {
    it('should generate correct validators for primitives', done => {
        PRIMITIVES.forEach(
            primitive => {
                expect(validation.getPrimitiveValidator(typeof primitive)(primitive)).to.be.true;
            }
        );

        done();
    });
});


describe('isSomething()', () => {
    it('should return true for defined variables', done => {
        PRIMITIVES.forEach(
            test => expect(validation.isSomething(test)).to.be.true
        );
        done();
    });

    it('should return false for undefined', done => {
        expect(validation.isSomething(undefined)).to.be.false;
        done();
    });
});


describe('isObject()', () => {
    it('should return true for a vanilla object', done => {
        expect(validation.isObject({})).to.be.true;
        expect(validation.isObject(new Object())).to.be.true;
        done();
    });

    it('should return false for non-vanilla-objects', done => {
        const nonVanillaObjects = [
            new Date(),
            NaN,
            [1, 2, 3],
            new Buffer('foo'),
            undefined,
            null,
        ];

        expect(
            _.every(
                nonVanillaObjects,
                _.negate(validation.isObject)
            )
        ).to.be.true;

        done();
    })
});


describe('isArrayOfType()', () => {
    it('should return true when each element matches the schema', done => {
        const arrayOfValidInstances = [
            {
                foo: 'string',
                bar: 1,
                baz: {
                    biz: 1,
                    boz: 1,

                    booz: {
                        barz: {
                            nested: 1,
                        }
                    }
                },
            },
            {
                foo: 'string'
            }
        ];

        expect(
            validation.isArrayOfType(VALID_SCHEMA)(arrayOfValidInstances)
        ).to.be.true;

        done();
    });

    it("should return false when an element doesn't match the schema", done => {
        const arrayWithSomeInvalidInstances = [
            {
                foo: 'string',
                bar: 1,
                baz: {
                    biz: 1,
                    boz: 1,

                    booz: {
                        barz: {
                            nested: 1,
                        }
                    }
                },
            },
            {
                foo: 'string'
            },
            {
                foo: 'string',
                bar: 'string',
                baz: {
                    biz: NaN,
                    boz: 1,

                    booz: {
                        barz: {
                            nested: 1,
                        }
                    }
                },
            },
            {
                foo: 1,
            },
            {
                foo: null,
            },
            {},
            1,
            undefined,
        ];

        expect(
            validation.isArrayOfType(VALID_SCHEMA)(arrayWithSomeInvalidInstances)
        ).to.be.false;

        done();
    });

    it('should return false if a non-array is passed', done => {
        expect(validation.isArrayOfType(VALID_SCHEMA)(0)).to.be.false;
        done();
    });
});


describe('isValidShape()', () => {
    it('should return null for plain objects that are valid Schemas', done => {
        expect(validation.isValidShape(VALID_SCHEMA)).to.be.null;
        expect(validation.isValidShape({
            baz: Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.number())()
        })).to.be.null;
        done();
    });

    it('should throw for valid SchemaTypes that aren\'t plain objects', done => {
        expect(() => validation.isValidShape(Schema.SchemaTypes.string())).to.throw(Error);
        expect(() => validation.isValidShape(
            Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.boolean()))
        ).to.throw(Error);
        done();
    });

    it('should throw for plain objects that aren\'t SchemaTypes', done => {
        expect(() => validation.isValidShape({ foo: 'bar' })).to.throw(Error);
        expect(() => validation.isValidShape({})).to.throw(Error);
        done();
    });

    it('should throw for non-objects', done => {
        expect(() => validation.isValidShape(NaN)).to.throw(Error);
        expect(() => validation.isValidShape('foo')).to.throw(Error);
        expect(() => validation.isValidShape(undefined)).to.throw(Error);
        done();
    });
});


describe('getOptionalValidator()', () => {
    const validateOptionalString = validation.getOptionalValidator(str => typeof str === 'string');

    it('should validate values of the correct type', done => {
        expect(validateOptionalString('foo')).to.be.true;
        expect(validateOptionalString(String('bar'))).to.be.true;
        done();
    });

    it('should validate undefined values', done => {
        expect(validateOptionalString(undefined)).to.be.true;
        done();
    });

    it('should fail for defined values of the wrong type', done => {
        expect(validateOptionalString(5)).to.be.false;
        expect(validateOptionalString({})).to.be.false;
        expect(validateOptionalString(false)).to.be.false;
        done();
    });
});

describe('toString()', () => {
    it('should have the same value as Object.toString()', done => {
        PRIMITIVES.forEach(
            primitive => expect(
                validation.toString(primitive) === Object.prototype.toString.call(primitive)
            ).to.be.true
        );
        done();
    });
});
