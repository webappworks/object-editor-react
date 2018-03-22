/*
 * Test Schemas and SchemaTypes.
 */

import * as Schema from '../../Schema';
import { expect } from 'chai';
import _ from 'lodash';

describe('SchemaType()', () => {
    it('should', done => {
        const a = new Schema.SchemaTypeClass(() => null, 'adf', {});
        a.type = 'bar';
        done();
    });
});
